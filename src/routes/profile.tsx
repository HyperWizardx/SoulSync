import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Settings, Trophy, ShoppingBag, Users, Edit2, X, Check, LogOut, Sun, Moon, Type, Target as TargetIcon } from "lucide-react";
import { useUserStore, useProfileSummary } from "@/hooks/useUserStore";
import { useState } from "react";
import { toast } from "sonner";
import { MiniAvatar3D } from "@/components/MiniAvatar3D";
import { AvatarIcon } from "@/components/avatars/AvatarArt";
import { getArchetypeStyle } from "@/lib/archetype";
import { WeeklyChart } from "@/components/WeeklyChart";
import {
  ACHIEVEMENTS,
  REWARD_BY_RARITY,
  RARITY_CLASSES,
  RARITY_LABEL,
  achievementProgress,
  type AchievementContext,
} from "@/lib/achievements";
import { getItem, getItemByName } from "@/lib/items";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Tu perfil de héroe | SoulSync" },
      { name: "description", content: "Consulta tus trofeos, atributos RPG, logros y objetos reales derivados de tus misiones completadas en SoulSync." },
      { property: "og:title", content: "Tu perfil de héroe | SoulSync" },
      { property: "og:description", content: "Trofeos, atributos y logros calculados con tu actividad real de bienestar." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProfilePage() {
  const { user, updateUser, updateSettings, archetypeName, signOut, useItem, toggleEquip } = useUserStore();
  const { data: summary } = useProfileSummary();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | "desbloqueados" | "pendientes">("todos");
  const archStyle = getArchetypeStyle(user.archetype);

  const unlocked = new Set(user.achievements);
  const ctx = (summary?.context as AchievementContext | undefined) ?? null;

  const trophies = [
    { emoji: "⭐", label: "Nivel", value: summary?.trophies.level ?? user.level },
    { emoji: "🔥", label: "Racha", value: summary?.trophies.streak ?? user.streak },
    { emoji: "🎯", label: "Misiones", value: summary?.trophies.missions ?? user.missionHistory.length },
    { emoji: "📱", label: "Misiones AR", value: summary?.trophies.missionsAR ?? 0 },
    { emoji: "📔", label: "Check-ins", value: summary?.trophies.checkins ?? 0 },
    { emoji: "🗺️", label: "Zonas", value: summary?.trophies.zonesUnlocked ?? 0 },
    { emoji: "📆", label: "Días activos (30 d)", value: summary?.trophies.activeDays30 ?? 0 },
    { emoji: "✨", label: "XP (30 d)", value: summary?.trophies.xp30 ?? 0 },
    { emoji: "🏆", label: "Logros", value: unlocked.size },
  ];

  const visibleAchievements = ACHIEVEMENTS.filter((a) =>
    filter === "todos" ? true : filter === "desbloqueados" ? unlocked.has(a.code) : !unlocked.has(a.code),
  );

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/auth", search: { mode: "login" } });
  };

  const attributes = [
    { name: "Resiliencia", value: user.attributes.resiliencia, category: "movimiento", categoryLabel: "movimiento" },
    { name: "Empatía", value: user.attributes.empatia, category: "social", categoryLabel: "conexión social" },
    { name: "Mindfulness", value: user.attributes.mindfulness, category: "autocuidado", categoryLabel: "autocuidado" },
    { name: "Autoconocimiento", value: user.attributes.autoconocimiento, category: "reflexion", categoryLabel: "reflexión" },
    { name: "Conexión Social", value: user.attributes.conexionSocial, category: "social", categoryLabel: "conexión social" },
    { name: "Creatividad", value: user.attributes.creatividad, category: "cognitivo", categoryLabel: "actividad cognitiva" },
  ];

  const handleSaveName = () => {
    if (editName.trim()) {
      updateUser({ name: editName.trim() });
      toast.success("Nombre actualizado", { icon: "✨" });
    }
    setEditing(false);
  };

  const xpPercent = (user.xp / 600) * 100;
  const textSizes: Array<{ v: "normal" | "large" | "xl"; label: string }> = [
    { v: "normal", label: "A" },
    { v: "large", label: "A+" },
    { v: "xl", label: "A++" },
  ];


  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-cinzel font-bold text-foreground">Perfil</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Configuración"
            className="rounded-lg p-2 text-muted-foreground hover:bg-card hover:text-foreground transition-all active:scale-90 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Settings className={`h-5 w-5 transition-transform duration-300 ${showSettings ? "rotate-90" : ""}`} />
          </button>
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
          </div>
        )}

        {/* Avatar Card */}
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-gradient-to-b from-primary/10 to-card p-6">
          <div className="relative">
            <MiniAvatar3D size={140} glowColor={archStyle.glow} exposure={archStyle.exposure} />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg">
              {user.level}
            </span>
            <span className="absolute -top-1 -left-1 rounded-full ring-4 ring-card">
              <AvatarIcon index={user.avatar} size={34} />
            </span>
          </div>

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
              <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <p className="text-xs text-muted-foreground">{archetypeName} • Nivel {user.level}</p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-soul-gold">{user.xp} / 600 XP</span>
          </div>
          <div className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-soul-gold transition-all duration-1000" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        {/* Evolución semanal */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground mb-3">Evolución semanal</h2>
          <WeeklyChart />
        </div>

        {/* Trofeos reales */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Trofeos</h2>
          <p className="text-[11px] text-muted-foreground">Calculados con tu actividad real registrada.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {trophies.map((t) => (
              <div key={t.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <span className="text-lg">{t.emoji}</span>
                <p className="text-base font-bold text-foreground">{t.value}</p>
                <p className="text-[9px] leading-tight text-muted-foreground">{t.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Link to="/store" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95 min-h-[44px]">
            <ShoppingBag className="h-5 w-5 text-soul-gold" />
            <span className="text-[10px] text-muted-foreground">Tienda</span>
          </Link>
          <Link to="/community" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95 min-h-[44px]">
            <Users className="h-5 w-5 text-soul-teal" />
            <span className="text-[10px] text-muted-foreground">Comunidad</span>
          </Link>
          <Link to="/missions" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95 min-h-[44px]">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-[10px] text-muted-foreground">{unlocked.size}/{ACHIEVEMENTS.length} logros</span>
          </Link>
        </div>

        {/* Inventario */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Mochila</h2>
          {user.items.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Aún no tienes objetos. <Link to="/store" className="text-primary underline">Visita la tienda</Link> para potenciar tus misiones.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {user.items.map((inv) => {
                const item = getItem(inv.item_key) ?? getItemByName(inv.item_name);
                const active = user.effects.some((e) => e.item_key === inv.item_key);
                return (
                  <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <span className="text-2xl">{item?.emoji ?? "🎁"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{inv.item_name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{item?.desc ?? ""}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {inv.kind === "permanent" ? (inv.equipped ? "Equipado" : "Disponible") : `x${inv.quantity}`}
                    </span>
                    {item && inv.kind === "consumable" && (
                      <button
                        onClick={async () => {
                          const ok = await useItem(item.key);
                          if (ok) toast.success(`${item.name} activado`, { icon: item.emoji });
                        }}
                        className="rounded-lg bg-soul-teal/15 px-2 py-1 text-[11px] font-semibold text-soul-teal active:scale-95"
                      >
                        Usar
                      </button>
                    )}
                    {item && inv.kind === "permanent" && (
                      <button
                        onClick={async () => {
                          const ok = await toggleEquip(item.key);
                          if (ok) toast.success(`${item.name} actualizado`, { icon: item.emoji });
                        }}
                        className="rounded-lg bg-soul-gold/15 px-2 py-1 text-[11px] font-semibold text-soul-gold active:scale-95"
                      >
                        {inv.equipped ? "Quitar" : "Equipar"}
                      </button>
                    )}
                    {active && <span className="text-[10px] text-primary">activo</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attributes */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Atributos RPG</h2>
          <p className="text-[11px] text-muted-foreground">Cada atributo crece con las misiones que realmente completas.</p>
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
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {c30} misiones de {attr.categoryLabel} (30 d) ·{" "}
                    <span className={delta > 0 ? "text-soul-teal" : delta < 0 ? "text-destructive" : ""}>
                      {delta > 0 ? `+${delta}` : delta} vs. semana previa
                    </span>
                  </p>
                  {expandedAttr === attr.name && (
                    <p className="mt-2 text-[10px] text-muted-foreground animate-fade-in">
                      Sube completando misiones de {attr.categoryLabel}. Nivel actual:{" "}
                      {attr.value < 40 ? "Principiante" : attr.value < 70 ? "Intermedio" : "Avanzado"}.
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel font-semibold text-foreground">Logros</h2>
            <span className="text-[11px] text-muted-foreground">{unlocked.size}/{ACHIEVEMENTS.length}</span>
          </div>
          <div className="mt-2 flex gap-2">
            {(["todos", "desbloqueados", "pendientes"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[11px] capitalize transition-all ${
                  filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {visibleAchievements.map((a) => {
              const isUnlocked = unlocked.has(a.code);
              const prog = ctx ? achievementProgress(a, ctx) : { value: 0, target: a.target, ratio: 0 };
              const reward = REWARD_BY_RARITY[a.rarity];
              const cls = RARITY_CLASSES[a.rarity];
              return (
                <div
                  key={a.code}
                  className={`rounded-xl border bg-card p-3 transition-all ${
                    isUnlocked ? `${cls.border} ${cls.glow}` : "border-border opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl ${isUnlocked ? "" : "grayscale"}`}>{a.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] ${cls.badge}`}>
                          {RARITY_LABEL[a.rarity]}
                        </span>
                      </div>
                      <p className="truncate text-[10px] text-muted-foreground">{a.description}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-soul-gold">
                      +{reward.xp} XP · +{reward.coins}🪙{reward.gems ? ` · +${reward.gems}💎` : ""}
                    </span>
                  </div>
                  {!isUnlocked && (
                    <div className="mt-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${prog.ratio * 100}%` }} />
                      </div>
                      <p className="mt-1 text-[9px] text-muted-foreground">{prog.value}/{prog.target}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </MobileLayout>
  );
}
