import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Settings, Trophy, ShoppingBag, Users, Edit2, X, Check, LogOut, Sun, Moon, Type, Target as TargetIcon } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";
import { useState } from "react";
import { toast } from "sonner";
import { MiniAvatar3D } from "@/components/MiniAvatar3D";
import { getArchetypeStyle } from "@/lib/archetype";
import { WeeklyChart } from "@/components/WeeklyChart";
import { ACHIEVEMENTS } from "@/lib/achievements";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateUser, updateSettings, archetypeName, signOut } = useUserStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const archStyle = getArchetypeStyle(user.archetype);

  const unlocked = new Set(user.achievements);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/auth", search: { mode: "login" } });
  };

  const attributes = [
    { name: "Resiliencia", value: user.attributes.resiliencia },
    { name: "Empatía", value: user.attributes.empatia },
    { name: "Mindfulness", value: user.attributes.mindfulness },
    { name: "Autoconocimiento", value: user.attributes.autoconocimiento },
    { name: "Conexión Social", value: user.attributes.conexionSocial },
    { name: "Creatividad", value: user.attributes.creatividad },
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
            <span className="absolute -top-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-card text-base ring-2 ring-primary/30">
              {archStyle.emoji}
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

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Link to="/store" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95 min-h-[44px]">
            <ShoppingBag className="h-5 w-5 text-soul-gold" />
            <span className="text-[10px] text-muted-foreground">Tienda</span>
          </Link>
          <Link to="/community" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95 min-h-[44px]">
            <Users className="h-5 w-5 text-soul-teal" />
            <span className="text-[10px] text-muted-foreground">Comunidad</span>
          </Link>
          <button
            onClick={() => toast(`${unlocked.size} de ${ACHIEVEMENTS.length} logros`, { icon: "🏆" })}
            aria-label="Logros"
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95 min-h-[44px]"
          >
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-[10px] text-muted-foreground">{unlocked.size}/{ACHIEVEMENTS.length}</span>
          </button>
        </div>

        {/* Attributes */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Atributos RPG</h2>
          <div className="mt-3 space-y-3">
            {attributes.map((attr) => (
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
                {expandedAttr === attr.name && (
                  <p className="mt-2 text-[10px] text-muted-foreground animate-fade-in">
                    Completa misiones para mejorar este atributo. Nivel actual: {attr.value < 40 ? "Principiante" : attr.value < 70 ? "Intermedio" : "Avanzado"}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Logros</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const isUnlocked = unlocked.has(a.code);
              return (
                <button
                  key={a.code}
                  onClick={() => toast(a.name, { icon: a.emoji, description: a.description })}
                  aria-label={a.name}
                  className={`flex flex-col items-center rounded-xl border p-3 transition-all hover:scale-105 active:scale-95 min-h-[44px] ${
                    isUnlocked ? "border-soul-gold/40 bg-soul-gold/5" : "border-border bg-card opacity-50 grayscale"
                  }`}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="mt-1 text-center text-[9px] text-muted-foreground leading-tight">{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
