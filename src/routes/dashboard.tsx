import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Heart, Brain, Zap, Shield, AlertTriangle, ChevronRight, Flame } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, avatarEmoji } = useUserStore();
  const [expandedStat, setExpandedStat] = useState<string | null>(null);

  const stats = [
    { label: "Bienestar", value: user.stats.bienestar, icon: Heart, color: "text-soul-teal" },
    { label: "Resiliencia", value: user.stats.resiliencia, icon: Shield, color: "text-primary" },
    { label: "Energía", value: user.stats.energia, icon: Zap, color: "text-soul-gold" },
    { label: "Claridad", value: user.stats.claridad, icon: Brain, color: "text-primary" },
  ];

  const recent = user.missionHistory.slice(0, 3);

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bienvenido de vuelta</p>
            <h1 className="text-xl font-cinzel font-bold text-foreground">{user.name} ⚔️</h1>
          </div>
          <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-2xl ring-2 ring-primary/30 transition-all hover:ring-primary hover:scale-110 active:scale-95">
            {avatarEmoji}
          </Link>
        </div>

        {/* World Preview */}
        <Link to="/world" className="mt-6 block overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-soul-teal/10 p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tu Mundo Emocional</p>
              <p className="font-cinzel font-semibold text-foreground">Valle de la Calma</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div className="mt-3 flex justify-center text-5xl animate-float">🏔️</div>
        </Link>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <button
              key={stat.label}
              onClick={() => {
                setExpandedStat(expandedStat === stat.label ? null : stat.label);
                toast(`${stat.label}: ${stat.value}%`, { icon: "📊" });
              }}
              className={`rounded-xl border bg-card p-3 text-left transition-all duration-300 active:scale-95 ${
                expandedStat === stat.label
                  ? "border-primary shadow-md shadow-primary/10 scale-[1.03]"
                  : "border-border hover:border-primary/50 hover:scale-[1.02]"
              }`}
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}%</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${stat.value}%` }} />
              </div>
              {expandedStat === stat.label && (
                <p className="mt-2 text-[10px] text-muted-foreground animate-fade-in">
                  {stat.label === "Bienestar" && "Indicador general de salud emocional"}
                  {stat.label === "Resiliencia" && "Capacidad de afrontar adversidades"}
                  {stat.label === "Energía" && "Nivel de vitalidad y motivación"}
                  {stat.label === "Claridad" && "Enfoque mental y toma de decisiones"}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* AI Alert */}
        <Link to="/alert" className="mt-6 flex items-center gap-3 rounded-xl border border-soul-gold/30 bg-soul-gold/5 p-3 transition-all hover:bg-soul-gold/10 hover:border-soul-gold/50 active:scale-[0.98]">
          <div className="animate-pulse">
            <AlertTriangle className="h-5 w-5 text-soul-gold" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Alerta IA</p>
            <p className="text-xs text-muted-foreground">Tu nivel de estrés ha subido un 15%</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        {/* Streak + Recursos */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="flex items-center justify-center gap-1 rounded-xl border border-soul-gold/30 bg-soul-gold/5 p-2">
            <Flame className="h-4 w-4 text-soul-gold" />
            <span className="text-sm font-bold text-soul-gold">{user.streak}d</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Monedas</p>
            <p className="text-sm font-bold text-foreground">{user.coins}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Gemas</p>
            <p className="text-sm font-bold text-primary">{user.gems}</p>
          </div>
        </div>

        {/* Misiones recientes / acceso */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel font-semibold text-foreground">Actividad reciente</h2>
            <Link to="/missions" className="text-xs text-primary hover:underline transition-colors">
              Ir a misiones →
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recent.length === 0 ? (
              <Link
                to="/missions"
                className="block rounded-xl border border-dashed border-primary/40 bg-card/40 p-4 text-center text-sm text-muted-foreground transition-all hover:border-primary hover:bg-card active:scale-[0.98]"
              >
                Aún no tienes misiones hoy. ¡Empieza una! ✨
              </Link>
            ) : (
              recent.map((h, i) => (
                <div
                  key={`${h.id}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-soul-teal/30 bg-soul-teal/5 p-3"
                >
                  <span className="text-xl">✅</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{h.title}</p>
                    <p className="text-[10px] text-muted-foreground">{h.date}</p>
                  </div>
                  <span className="text-[10px] font-bold text-soul-gold">+{h.xp} XP</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
