import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Heart, Brain, Zap, Shield, AlertTriangle, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const stats = [
  { label: "Bienestar", value: 72, icon: Heart, color: "text-soul-teal" },
  { label: "Resiliencia", value: 58, icon: Shield, color: "text-primary" },
  { label: "Energía", value: 85, icon: Zap, color: "text-soul-gold" },
  { label: "Claridad", value: 64, icon: Brain, color: "text-primary" },
];

const missions = [
  { title: "Meditación matutina", xp: 50, progress: 60, emoji: "🧘" },
  { title: "Diario emocional", xp: 30, progress: 30, emoji: "📓" },
  { title: "Caminata consciente", xp: 40, progress: 0, emoji: "🚶" },
];

function DashboardPage() {
  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bienvenido de vuelta</p>
            <h1 className="text-xl font-cinzel font-bold text-foreground">Héroe ⚔️</h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-2xl">
            🧙‍♂️
          </div>
        </div>

        {/* World Preview */}
        <Link to="/world" className="mt-6 block overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-soul-teal/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tu Mundo Emocional</p>
              <p className="font-cinzel font-semibold text-foreground">Valle de la Calma</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-3 flex justify-center text-5xl animate-float">🏔️</div>
        </Link>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}%</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stat.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* AI Alert */}
        <Link to="/alert" className="mt-6 flex items-center gap-3 rounded-xl border border-soul-gold/30 bg-soul-gold/5 p-3">
          <AlertTriangle className="h-5 w-5 text-soul-gold" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Alerta IA</p>
            <p className="text-xs text-muted-foreground">Tu nivel de estrés ha subido un 15%</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        {/* Active Missions */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel font-semibold text-foreground">Misiones Activas</h2>
            <Link to="/missions" className="text-xs text-primary">Ver todas</Link>
          </div>
          <div className="mt-3 space-y-3">
            {missions.map((m) => (
              <div key={m.title} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{m.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${m.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-soul-gold">+{m.xp} XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
