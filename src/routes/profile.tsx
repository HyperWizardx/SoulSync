import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileLayout } from "@/presentation/components/layout/MobileLayout";
import { Settings, ShoppingBag, Users, Edit2, X, Check, LogOut, Sun, Moon, Type, Target as TargetIcon, ShieldCheck, ChevronRight } from "lucide-react";
import { useAdminAccess } from "@/presentation/hooks/useAdmin";
import { useUserStore, useProfileSummary } from "@/presentation/hooks/useUserStore";
import { useState } from "react";
import { toast } from "sonner";
import { MiniAvatar3D } from "@/presentation/components/layout/MiniAvatar3D";
import { AuraHalo } from "@/presentation/components/avatars/AuraHalo";
import { useWellbeing } from "@/presentation/hooks/useWellbeing";
import { getArchetypeStyle } from "@/domain/identity/archetype";
import { useDevicePrefs } from "@/presentation/hooks/useDevicePrefs";
import { PrefSwitch } from "@/presentation/components/layout/PrefSwitch";
import { ReminderSettings } from "@/presentation/components/layout/ReminderSettings";
import { PageSkeleton } from "@/presentation/components/layout/PageSkeleton";
import { playSound } from "@/shared/sound";
import { tap as hapticTap } from "@/shared/haptics";
import { WeeklyChart } from "@/presentation/components/layout/WeeklyChart";
import { SupportButton } from "@/presentation/components/wellbeing/SupportSheet";
import {
  ACHIEVEMENTS,
  achievementProgress,
  type AchievementContext,
} from "@/domain/gamification/achievements";
import { getItem, getItemByName } from "@/domain/gamification/items";
import { XP_PER_LEVEL } from "@/domain/gamification/progression";
import { attributeSourceCategory } from "@/domain/gamification/missionsData";
import type { TaskCategoryName, UserAttributes } from "@/domain/gamification/rewards";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Tu perfil de héroe | SoulSync" },
      { name: "description", content: "Tu héroe en SoulSync: trofeos, atributos, logros y mochila." },
      { property: "og:title", content: "Tu perfil de héroe | SoulSync" },
      { property: "og:description", content: "Trofeos, atributos y logros de tu héroe en SoulSync." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProfilePage() {
  const { user, isLoading, updateUser, updateSettings, archetypeName, signOut, useItem: applyItem, toggleEquip } = useUserStore();
  const { data: summary } = useProfileSummary();
  const { data: adminAccess } = useAdminAccess();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const archStyle = getArchetypeStyle(user.archetype);
  const wellbeing = useWellbeing();

  const unlocked = new Set(user.achievements);
  const ctx = (summary?.context as AchievementContext | undefined) ?? null;

  const trophies = [
    { icon: "star-formation", label: "Nivel", value: summary?.trophies?.level ?? user.level },
    { icon: "flame", label: "Racha", value: summary?.trophies?.streak ?? user.streak },
    { icon: "archery-target", label: "Misiones", value: summary?.trophies?.missions ?? user.missionHistory.length },
    { icon: "smartphone", label: "Misiones AR", value: summary?.trophies?.missionsAR ?? 0 },
    { icon: "book-cover", label: "Check-ins", value: summary?.trophies?.checkins ?? 0 },
    { icon: "treasure-map", label: "Zonas", value: summary?.trophies?.zonesUnlocked ?? 0 },
    { icon: "calendar", label: "Días activos (30 d)", value: summary?.trophies?.activeDays30 ?? 0 },
    { icon: "sparkles", label: "XP (30 d)", value: summary?.trophies?.xp30 ?? 0 },
    { icon: "trophy-cup", label: "Logros", value: unlocked.size },
  ];

  // Logro pendiente más cercano según el progreso real.
  const nextAchievement = ctx
    ? ACHIEVEMENTS.filter((a) => !unlocked.has(a.code)).sort((x, y) => achievementProgress(y, ctx).ratio - achievementProgress(x, ctx).ratio)[0]
    : ACHIEVEMENTS.find((a) => !unlocked.has(a.code));

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/auth", search: { mode: "login" } });
  };

  // Cómo nombrar cada tipo de misión dentro de una frase ("misiones sociales", "de reflexión"...).
  const CATEGORY_PHRASE: Record<TaskCategoryName, [singular: string, plural: string]> = {
    autocuidado: ["de autocuidado", "de autocuidado"], reflexion: ["de reflexión", "de reflexión"], movimiento: ["de movimiento", "de movimiento"],
    social: ["social", "sociales"], cognitivo: ["cognitiva", "cognitivas"], ar: ["de realidad aumentada", "de realidad aumentada"],
  };
  // La categoría que hace crecer cada atributo se calcula con las recompensas del catálogo de misiones.
  const ATTRIBUTE_NAMES: [keyof UserAttributes, string][] = [
    ["resiliencia", "Resiliencia"], ["empatia", "Empatía"], ["mindfulness", "Mindfulness"],
    ["autoconocimiento", "Autoconocimiento"], ["conexionSocial", "Conexión Social"], ["creatividad", "Creatividad"],
  ];
  const attributes = ATTRIBUTE_NAMES.map(([key, name]) => {
    const category: TaskCategoryName = attributeSourceCategory(key) ?? "autocuidado";
    return { name, value: user.attributes[key], category, phrase: CATEGORY_PHRASE[category] };
  });

  const handleSaveName = () => {
    if (editName.trim()) {
      updateUser({ name: editName.trim() });
      toast.success("Nombre actualizado");
    }
    setEditing(false);
  };

  const devicePrefs = useDevicePrefs();
  const xpPercent = (user.xp / XP_PER_LEVEL) * 100;
  const textSizes: Array<{ v: "normal" | "large" | "xl"; label: string }> = [
    { v: "normal", label: "A" },
    { v: "large", label: "A+" },
    { v: "xl", label: "A++" },
  ];


  if (isLoading) return <MobileLayout><PageSkeleton variant="profile" /></MobileLayout>;

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-cinzel font-bold text-foreground">Perfil</h1>
          <div className="flex items-center gap-2">
          <SupportButton />
          <button
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Configuración"
            className="rounded-lg p-2 text-muted-foreground hover:bg-card hover:text-foreground transition-all active:scale-90 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Settings className={`h-5 w-5 transition-transform duration-300 ${showSettings ? "rotate-90" : ""}`} />
          </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 rounded-xl border border-border bg-card p-4 animate-fade-in space-y-4">
            <p className="text-sm font-semibold text-foreground">Configuración</p>

            {/* Tema */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Tema</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ theme: "dark" })}
                  aria-label="Tema oscuro"
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm transition-all min-h-[44px] ${
                    user.settings.theme === "dark" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  <Moon className="h-4 w-4" /> Oscuro
                </button>
                <button
                  onClick={() => updateSettings({ theme: "light" })}
                  aria-label="Tema claro"
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm transition-all min-h-[44px] ${
                    user.settings.theme === "light" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  <Sun className="h-4 w-4" /> Claro
                </button>
              </div>
            </div>

            {/* Tamaño texto */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Type className="h-3 w-3" /> Tamaño de texto</p>
              <div className="flex gap-2">
                {textSizes.map((t) => (
                  <button
                    key={t.v}
                    onClick={() => updateSettings({ textSize: t.v })}
                    aria-label={`Tamaño de texto ${t.label}`}
                    className={`flex-1 rounded-lg py-2 text-sm transition-all min-h-[44px] ${
                      user.settings.textSize === t.v ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferencias de este dispositivo: movimiento, sonido y vibración */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">En este dispositivo</p>
              <div className="space-y-2">
                <PrefSwitch
                  label="Reducir movimiento"
                  hint={devicePrefs.prefs.reduceMotion === null ? `Sigue al sistema (${devicePrefs.systemReduced ? "activado" : "desactivado"})` : "Menos animaciones y personajes quietos"}
                  checked={devicePrefs.reduceMotion}
                  onChange={(v) => devicePrefs.setPrefs({ reduceMotion: v })}
                />
                <PrefSwitch label="Sonidos" hint="Efectos cortos al completar misiones y subir de nivel" checked={devicePrefs.prefs.sound} onChange={(v) => { devicePrefs.setPrefs({ sound: v }); if (v) playSound("coin"); }} />
                <PrefSwitch label="Vibración" hint="Respuesta táctil en el móvil" checked={devicePrefs.prefs.haptics} onChange={(v) => { devicePrefs.setPrefs({ haptics: v }); if (v) hapticTap(); }} />
                <ReminderSettings archetype={user.archetype} />
              </div>
            </div>

            {/* Meta diaria */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><TargetIcon className="h-3 w-3" /> Meta diaria: {user.settings.dailyGoal} misiones</p>
              <input
                type="range"
                min={1}
                max={10}
                value={user.settings.dailyGoal}
                onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })}
                aria-label="Meta diaria de misiones"
                className="w-full accent-primary"
              />
            </div>

            <button
              onClick={() => { setEditing(true); setShowSettings(false); }}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-foreground hover:bg-secondary transition-all active:scale-95 min-h-[44px]"
            >
              <Edit2 className="h-4 w-4" /> Cambiar nombre
            </button>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-destructive hover:bg-destructive/10 transition-all active:scale-95 min-h-[44px]"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>

            {/* Créditos de los recursos gráficos (CC0 y CC BY 3.0) */}
            <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              Créditos: personajes y escenarios de <a className="underline" href="https://kaylousberg.com" target="_blank" rel="noreferrer">KayKit</a> (CC0).
              Íconos de <a className="underline" href="https://game-icons.net" target="_blank" rel="noreferrer">game-icons.net</a> por Lorc, Delapouite y colaboradores (CC BY 3.0)
              y <a className="underline" href="https://lucide.dev" target="_blank" rel="noreferrer">Lucide</a> (ISC).
            </p>
          </div>
        )}

        {/* Avatar Card */}
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-gradient-to-b from-primary/10 to-card p-6">
          <AuraHalo aura={wellbeing.data?.aura} color={archStyle.glow} showLabel={false}>
          <div className="relative">
            <MiniAvatar3D archetype={user.archetype} size={140} glowColor={archStyle.glow} exposure={archStyle.exposure} />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg">
              {user.level}
            </span>
          </div>
          </AuraHalo>
          {wellbeing.data?.aura && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Aura {wellbeing.data.aura.name}</span> · {wellbeing.data.aura.message}
            </p>
          )}

          {editing ? (
            <div className="mt-3 flex items-center gap-2 animate-fade-in">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={20}
                className="rounded-lg border border-primary bg-card px-3 py-1 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <button onClick={handleSaveName} aria-label="Guardar" className="rounded-full bg-soul-teal p-2 text-background active:scale-90 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setEditing(false)} aria-label="Cancelar" className="rounded-full bg-destructive p-2 text-destructive-foreground active:scale-90 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditing(true); setEditName(user.name); }}
              className="mt-3 group flex items-center gap-1 hover:text-primary transition-colors"
            >
              <h2 className="text-lg font-cinzel font-bold text-foreground group-hover:text-primary transition-colors">{user.name}</h2>
              <Edit2 className="h-3.5 w-3.5 text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity" aria-label="Cambiar nombre" />
            </button>
          )}

          <p className="text-xs text-muted-foreground">{archetypeName} • Nivel {user.level}</p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-soul-gold">{user.xp} / {XP_PER_LEVEL} XP</span>
          </div>
          <div className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-soul-gold transition-all duration-1000" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to="/store" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95 min-h-[44px]">
            <ShoppingBag className="h-5 w-5 text-soul-gold" />
            <span className="text-xs text-muted-foreground">Tienda</span>
          </Link>
          <Link to="/community" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95 min-h-[44px]">
            <Users className="h-5 w-5 text-soul-teal" />
            <span className="text-xs text-muted-foreground">Comunidad</span>
          </Link>
        </div>

        {/* Trofeos */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Trofeos</h2>
          <p className="text-xs text-muted-foreground">Las hazañas que llevas acumuladas en tu aventura.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {trophies.map((t) => (
              <div key={t.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <GameIcon name={t.icon} className="mx-auto h-5 w-5 text-soul-gold" />
                <p className="text-base font-bold text-foreground">{t.value}</p>
                <p className="text-xs leading-tight text-muted-foreground">{t.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logros: resumen aquí y la lista completa en su propia pantalla (formato de la Tienda) */}
        <Link
          to="/achievements"
          className="mt-6 block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel font-semibold text-foreground">Logros</h2>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              {unlocked.size}/{ACHIEVEMENTS.length} <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-soul-gold transition-all duration-700" style={{ width: `${(unlocked.size / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
          {nextAchievement ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <GameIcon name={nextAchievement.icon} className="h-4 w-4 text-primary" />
              Próximo: <span className="font-semibold text-foreground">{nextAchievement.name}</span> · {nextAchievement.description}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">¡Desbloqueaste todos los logros!</p>
          )}
        </Link>

        {/* Attributes */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Atributos de tu héroe</h2>
          <p className="text-xs text-muted-foreground">Entrena cada atributo con el tipo de misión que lo hace crecer. Toca uno para ver cómo.</p>
          <div className="mt-3 space-y-3">
            {attributes.map((attr) => {
              const c30 = summary?.categories30?.[attr.category] ?? 0;
              const c7 = summary?.categories7?.[attr.category] ?? 0;
              const cPrev = summary?.categoriesPrev7?.[attr.category] ?? 0;
              const delta = c7 - cPrev;
              return (
                <button
                  key={attr.name}
                  onClick={() => setExpandedAttr(expandedAttr === attr.name ? null : attr.name)}
                  className={`w-full text-left rounded-xl p-2 transition-all duration-300 ${
                    expandedAttr === attr.name ? "bg-card border border-primary/30" : "hover:bg-card/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{attr.name}</span>
                    <span className="text-muted-foreground">{attr.value}/100</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${attr.value}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c30} {c30 === 1 ? `misión ${attr.phrase[0]}` : `misiones ${attr.phrase[1]}`} este mes ·{" "}
                    <span className={delta > 0 ? "text-soul-teal" : delta < 0 ? "text-destructive" : ""}>
                      {delta > 0 ? `+${delta}` : delta} vs. la semana pasada
                    </span>
                  </p>
                  {expandedAttr === attr.name && (
                    <p className="mt-2 text-xs text-muted-foreground animate-fade-in">
                      Sube completando misiones {attr.phrase[1]}. Nivel actual:{" "}
                      {attr.value < 40 ? "Principiante" : attr.value < 70 ? "Intermedio" : "Avanzado"}.
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inventario */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Mochila</h2>
          {user.items.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Tu mochila está vacía. <Link to="/store" className="text-primary underline">Pasa por la tienda</Link> y equípate para tus próximas misiones.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {user.items.map((inv) => {
                const item = getItem(inv.item_key) ?? getItemByName(inv.item_name);
                const active = user.effects.some((e) => e.item_key === inv.item_key);
                return (
                  <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-soul-gold/10 text-soul-gold"><GameIcon name={item?.icon ?? "present"} className="h-6 w-6" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{inv.item_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{item?.desc ?? ""}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {inv.kind === "permanent" ? (inv.equipped ? "Equipado" : "Disponible") : `x${inv.quantity}`}
                    </span>
                    {item && inv.kind === "consumable" && (
                      <button
                        onClick={async () => {
                          const ok = await applyItem(item.key);
                          if (ok) toast.success(`${item.name} activado`, { icon: <GameIcon name={item.icon} className="h-5 w-5 text-soul-gold" /> });
                        }}
                        className="rounded-lg bg-soul-teal/15 px-2 py-1 text-xs font-semibold text-soul-teal active:scale-95"
                      >
                        Usar
                      </button>
                    )}
                    {item && inv.kind === "permanent" && (
                      <button
                        onClick={async () => {
                          const ok = await toggleEquip(item.key);
                          if (ok) toast.success(`${item.name} actualizado`, { icon: <GameIcon name={item.icon} className="h-5 w-5 text-soul-gold" /> });
                        }}
                        className="rounded-lg bg-soul-gold/15 px-2 py-1 text-xs font-semibold text-soul-gold active:scale-95"
                      >
                        {inv.equipped ? "Quitar" : "Equipar"}
                      </button>
                    )}
                    {active && <span className="text-xs text-primary">activo</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Evolución semanal */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground mb-3">Tu semana de aventura</h2>
          <WeeklyChart />
        </div>

        {adminAccess?.isAdmin && (
          <Link
            to={adminAccess.psicologo ? "/admin" : "/admin/metricas"}
            className="mt-6 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3 transition-all hover:border-primary active:scale-95"
          >
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Panel de administración</p>
              <p className="text-xs text-muted-foreground">
                {adminAccess.psicologo ? "Seguimiento de estudiantes" : "Métricas de la población"}
              </p>
            </div>
          </Link>
        )}
      </div>
    </MobileLayout>
  );
}
