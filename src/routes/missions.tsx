import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { useState } from "react";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/missions")({
  component: MissionsPage,
});

const tabs = ["Activas", "Completadas", "Bloqueadas"] as const;

const activeMissions = [
  { title: "Meditación matutina", desc: "5 min de respiración guiada", xp: 50, progress: 60, emoji: "🧘", rarity: "Común" },
  { title: "Diario emocional", desc: "Escribe cómo te sientes hoy", xp: 30, progress: 30, emoji: "📓", rarity: "Común" },
  { title: "Caminata consciente", desc: "20 min al aire libre", xp: 40, progress: 0, emoji: "🚶", rarity: "Raro" },
];

const completedMissions = [
  { title: "Primera meditación", desc: "Completaste tu primera sesión", xp: 25, emoji: "✅", rarity: "Común" },
  { title: "Intro al diario", desc: "Tu primera entrada", xp: 20, emoji: "📝", rarity: "Común" },
];

const blockedMissions = [
  { title: "Modo difícil: 7 días", desc: "Completa 7 días seguidos", xp: 200, emoji: "🔒", rarity: "Épica", req: "Nivel 5" },
  { title: "Guardián del bosque", desc: "Desbloquea el Bosque Interior", xp: 150, emoji: "🔒", rarity: "Legendaria", req: "Nivel 10" },
];

function MissionsPage() {
  const [tab, setTab] = useState<typeof tabs[number]>("Activas");

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-cinzel font-bold text-foreground">Misiones</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu camino de crecimiento</p>

        {/* Tabs */}
        <div className="mt-6 flex rounded-xl bg-card p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3">
          {tab === "Activas" && activeMissions.map((m) => (
            <div key={m.title} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{m.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{m.title}</p>
                    <span className={`text-[10px] rounded-full px-2 py-0.5 ${
                      m.rarity === "Raro" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>{m.rarity}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${m.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-soul-gold">+{m.xp} XP</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {tab === "Completadas" && completedMissions.map((m) => (
            <div key={m.title} className="rounded-xl border border-soul-teal/30 bg-soul-teal/5 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.emoji}</span>
                <div>
                  <p className="font-semibold text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                  <span className="text-[10px] text-soul-gold">+{m.xp} XP ganados</span>
                </div>
              </div>
            </div>
          ))}

          {tab === "Bloqueadas" && blockedMissions.map((m) => (
            <div key={m.title} className="rounded-xl border border-border bg-card/50 p-4 opacity-70">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                  <span className={`mt-1 inline-block text-[10px] rounded-full px-2 py-0.5 ${
                    m.rarity === "Épica" ? "bg-primary/20 text-primary" : "bg-soul-gold/20 text-soul-gold"
                  }`}>{m.rarity} • Requiere {m.req}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
