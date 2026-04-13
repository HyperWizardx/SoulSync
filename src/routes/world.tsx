import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/world")({
  component: WorldPage,
});

const zones = [
  { name: "Valle de la Calma", emoji: "🏔️", status: "Actual", color: "border-soul-teal bg-soul-teal/10", desc: "Un lugar sereno donde la paz interior florece." },
  { name: "Bosque Interior", emoji: "🌲", status: "Explorado", color: "border-primary bg-primary/10", desc: "Árboles ancestrales que guardan tu sabiduría." },
  { name: "Mar de Emociones", emoji: "🌊", status: "Bloqueado", color: "border-border bg-card opacity-50", desc: "Desbloquea alcanzando Nivel 5." },
  { name: "Montaña de Fuerza", emoji: "⛰️", status: "Bloqueado", color: "border-border bg-card opacity-50", desc: "Desbloquea alcanzando Nivel 10." },
];

const timeline = [
  { time: "Hoy 8:00", mood: "😊", label: "Tranquilo", value: 80 },
  { time: "Ayer 20:00", mood: "😔", label: "Algo triste", value: 40 },
  { time: "Ayer 14:00", mood: "😤", label: "Frustrado", value: 30 },
  { time: "Ayer 8:00", mood: "😌", label: "En paz", value: 75 },
];

function WorldPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-cinzel font-bold text-foreground">Mi Mundo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu mapa emocional</p>

        {/* World Map */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {zones.map((zone) => (
            <button
              key={zone.name}
              onClick={() => {
                if (zone.status === "Bloqueado") {
                  toast.error("Zona bloqueada. " + zone.desc, { icon: "🔒" });
                } else {
                  setSelectedZone(selectedZone === zone.name ? null : zone.name);
                  toast(zone.name, { icon: zone.emoji, description: zone.desc });
                }
              }}
              className={`rounded-2xl border-2 p-4 text-center transition-all duration-300 active:scale-95 ${zone.color} ${
                selectedZone === zone.name ? "scale-105 shadow-lg" : "hover:scale-[1.03]"
              }`}
            >
              <span className={`text-4xl inline-block ${selectedZone === zone.name ? "animate-float" : ""}`}>{zone.emoji}</span>
              <p className="mt-2 text-sm font-semibold text-foreground">{zone.name}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${
                zone.status === "Actual" ? "bg-soul-teal/20 text-soul-teal" :
                zone.status === "Explorado" ? "bg-primary/20 text-primary" :
                "bg-secondary text-muted-foreground"
              }`}>{zone.status}</span>
            </button>
          ))}
        </div>

        {/* Emotion Timeline */}
        <div className="mt-8">
          <h2 className="font-cinzel font-semibold text-foreground">Timeline Emocional</h2>
          <div className="mt-4 space-y-3">
            {timeline.map((t, i) => (
              <button
                key={i}
                onClick={() => toast(`${t.label} — ${t.value}% bienestar`, { icon: t.mood })}
                className="flex w-full items-center gap-3 text-left transition-all hover:translate-x-1 active:scale-[0.98]"
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl">{t.mood}</span>
                  {i < timeline.length - 1 && <div className="mt-1 h-6 w-0.5 bg-border" />}
                </div>
                <div className="flex-1 rounded-xl border border-border bg-card p-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.time}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${t.value}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
