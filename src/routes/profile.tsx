import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Settings, Trophy, ShoppingBag, Users } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const attributes = [
  { name: "Resiliencia", value: 58, max: 100 },
  { name: "Empatía", value: 72, max: 100 },
  { name: "Mindfulness", value: 45, max: 100 },
  { name: "Autoconocimiento", value: 64, max: 100 },
  { name: "Conexión Social", value: 38, max: 100 },
  { name: "Creatividad", value: 80, max: 100 },
];

const achievements = [
  { emoji: "🏅", name: "Primera misión" },
  { emoji: "🔥", name: "3 días seguidos" },
  { emoji: "📓", name: "Primer diario" },
  { emoji: "🧘", name: "10 meditaciones" },
];

function ProfilePage() {
  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-cinzel font-bold text-foreground">Perfil</h1>
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-card">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Avatar Card */}
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-gradient-to-b from-primary/10 to-card p-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card text-5xl ring-4 ring-primary/30">
              🧙‍♂️
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
          </div>
          <h2 className="mt-3 text-lg font-cinzel font-bold text-foreground">Héroe</h2>
          <p className="text-xs text-muted-foreground">Guerrero • Nivel 3</p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-soul-gold">450 / 600 XP</span>
          </div>
          <div className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-soul-gold" style={{ width: "75%" }} />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Link to="/store" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center hover:border-primary/50">
            <ShoppingBag className="h-5 w-5 text-soul-gold" />
            <span className="text-[10px] text-muted-foreground">Tienda</span>
          </Link>
          <Link to="/community" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center hover:border-primary/50">
            <Users className="h-5 w-5 text-soul-teal" />
            <span className="text-[10px] text-muted-foreground">Comunidad</span>
          </Link>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-[10px] text-muted-foreground">Logros</span>
          </div>
        </div>

        {/* Attributes */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Atributos RPG</h2>
          <div className="mt-3 space-y-3">
            {attributes.map((attr) => (
              <div key={attr.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{attr.name}</span>
                  <span className="text-muted-foreground">{attr.value}/{attr.max}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${attr.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mt-6 mb-4">
          <h2 className="font-cinzel font-semibold text-foreground">Logros</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {achievements.map((a) => (
              <div key={a.name} className="flex min-w-[80px] flex-col items-center rounded-xl border border-border bg-card p-3">
                <span className="text-2xl">{a.emoji}</span>
                <span className="mt-1 text-center text-[10px] text-muted-foreground">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
