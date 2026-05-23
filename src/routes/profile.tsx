import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Settings, Trophy, ShoppingBag, Users, Edit2, X, Check, LogOut } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";
import { useState } from "react";
import { toast } from "sonner";
import { MiniAvatar3D } from "@/components/MiniAvatar3D";
import { getArchetypeStyle } from "@/lib/archetype";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const achievements = [
  { emoji: "🏅", name: "Primera misión" },
  { emoji: "🔥", name: "3 días seguidos" },
  { emoji: "📓", name: "Primer diario" },
  { emoji: "🧘", name: "10 meditaciones" },
];

function ProfilePage() {
  const { user, updateUser, avatarEmoji, archetypeName, signOut } = useUserStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const archStyle = getArchetypeStyle(user.archetype);

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
      toast.success("Nombre actualizado: " + editName.trim(), { icon: "✨" });
    }
    setEditing(false);
  };

  const xpPercent = (user.xp / 600) * 100;

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-cinzel font-bold text-foreground">Perfil</h1>
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              if (!showSettings) toast("Configuración", { icon: "⚙️" });
            }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-card hover:text-foreground transition-all active:scale-90"
          >
            <Settings className={`h-5 w-5 transition-transform duration-300 ${showSettings ? "rotate-90" : ""}`} />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 rounded-xl border border-border bg-card p-4 animate-fade-in space-y-3">
            <p className="text-sm font-semibold text-foreground">Configuración</p>
            <button
              onClick={() => {
                setEditing(true);
                setShowSettings(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-foreground hover:bg-secondary transition-all active:scale-95"
            >
              <Edit2 className="h-4 w-4" /> Cambiar nombre
            </button>
            <button
              onClick={() => {
                toast.info("Notificaciones activadas", { icon: "🔔" });
              }}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-foreground hover:bg-secondary transition-all active:scale-95"
            >
              🔔 Notificaciones
            </button>
            <button
              onClick={() => {
                toast.info("Tema oscuro activo", { icon: "🌙" });
              }}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-foreground hover:bg-secondary transition-all active:scale-95"
            >
              🌙 Tema
            </button>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-destructive hover:bg-destructive/10 transition-all active:scale-95"
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
              <button onClick={handleSaveName} className="rounded-full bg-soul-teal p-1 text-background active:scale-90 transition-transform">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setEditing(false)} className="rounded-full bg-destructive p-1 text-destructive-foreground active:scale-90 transition-transform">
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

        {/* Quick Links */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Link to="/store" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95">
            <ShoppingBag className="h-5 w-5 text-soul-gold" />
            <span className="text-[10px] text-muted-foreground">Tienda</span>
          </Link>
          <Link to="/community" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95">
            <Users className="h-5 w-5 text-soul-teal" />
            <span className="text-[10px] text-muted-foreground">Comunidad</span>
          </Link>
          <button
            onClick={() => toast("4 logros desbloqueados", { icon: "🏆" })}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:scale-105 active:scale-95"
          >
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-[10px] text-muted-foreground">Logros</span>
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
        <div className="mt-6 mb-4">
          <h2 className="font-cinzel font-semibold text-foreground">Logros</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {achievements.map((a) => (
              <button
                key={a.name}
                onClick={() => toast(`Logro: ${a.name}`, { icon: a.emoji })}
                className="flex min-w-[80px] flex-col items-center rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/50 hover:scale-105 active:scale-95"
              >
                <span className="text-2xl">{a.emoji}</span>
                <span className="mt-1 text-center text-[10px] text-muted-foreground">{a.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
