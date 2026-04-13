import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";

export const Route = createFileRoute("/world")({
  component: WorldPage,
});

const zones = [
  { name: "Valle de la Calma", emoji: "🏔️", status: "Actual", color: "border-soul-teal bg-soul-teal/10" },
  { name: "Bosque Interior", emoji: "🌲", status: "Explorado", color: "border-primary bg-primary/10" },
  { name: "Mar de Emociones", emoji: "🌊", status: "Bloqueado", color: "border-border bg-card opacity-50" },
  { name: "Montaña de Fuerza", emoji: "⛰️", status: "Bloqueado", color: "border-border bg-card opacity-50" },
];

const timeline = [
  { time: "Hoy 8:00", mood: "😊", label: "Tranquilo", value: 80 },
  { time: "Ayer 20:00", mood: "😔", label: "Algo triste", value: 40 },
  { time: "Ayer 14:00", mood: "😤", label: "Frustrado", value: 30 },
  { time: "Ayer 8:00", mood: "😌", label: "En paz", value: 75 },
];

function WorldPage() {
  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-cinzel font-bold text-foreground">Mi Mundo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu mapa emocional</p>

        {/* World Map */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {zones.map((zone) => (
            <div key={zone.name} className={`rounded-2xl border-2 p-4 text-center ${zone.color}`}>
              <span className="text-4xl">{zone.emoji}</span>
              <p className="mt-2 text-sm font-semibold text-foreground">{zone.name}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${
                zone.status === "Actual" ? "bg-soul-teal/20 text-soul-teal" :
                zone.status === "Explorado" ? "bg-primary/20 text-primary" :
                "bg-secondary text-muted-foreground"
              }`}>{zone.status}</span>
            </div>
          ))}
        </div>

        {/* Emotion Timeline */}
        <div className="mt-8">
          <h2 className="font-cinzel font-semibold text-foreground">Timeline Emocional</h2>
          <div className="mt-4 space-y-3">
            {timeline.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-2xl">{t.mood}</span>
                  {i < timeline.length - 1 && <div className="mt-1 h-6 w-0.5 bg-border" />}
                </div>
                <div className="flex-1 rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.time}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${t.value}%` }} />
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
