import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Heart, Activity, Moon, Thermometer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai")({
  component: AIPage,
});

const biometrics = [
  { label: "Ritmo Cardíaco", value: "72 bpm", icon: Heart, status: "Normal", color: "text-soul-teal" },
  { label: "Variabilidad", value: "45 ms", icon: Activity, status: "Bajo", color: "text-soul-gold" },
  { label: "Calidad Sueño", value: "78%", icon: Moon, status: "Buena", color: "text-primary" },
  { label: "Estrés", value: "Medio", icon: Thermometer, status: "Alerta", color: "text-destructive" },
];

const aiLog = [
  { time: "08:15", msg: "Buenos días. Tu sueño fue reparador anoche. ¡Buen inicio!", type: "positive" },
  { time: "10:30", msg: "Detecto tensión muscular elevada. ¿Una pausa de respiración?", type: "warning" },
  { time: "14:00", msg: "Tu ritmo cardíaco subió. Misión de calma sugerida.", type: "alert" },
  { time: "16:45", msg: "Patrón de estrés descendente. Vas por buen camino 💪", type: "positive" },
];

const moods = ["😊", "😌", "😐", "😔", "😤", "😢"];

function AIPage() {
  const [selectedBio, setSelectedBio] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState("😊");

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-cinzel font-bold text-foreground">IA Predictiva</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu guardián emocional</p>

        {/* Mood Ring */}
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={() => toast("Tu estado emocional está equilibrado", { icon: currentMood })}
            className="relative group active:scale-95 transition-transform"
          >
            <div className="h-36 w-36 rounded-full border-4 border-primary bg-gradient-to-br from-primary/20 via-soul-teal/10 to-soul-gold/10 animate-orb-glow group-hover:border-soul-teal transition-colors" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl group-hover:scale-110 transition-transform">{currentMood}</span>
              <span className="mt-1 text-xs font-semibold text-foreground">Estable</span>
            </div>
            <div className="absolute inset-[-8px] rounded-full border-2 border-primary/30 animate-pulse-ring" />
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">Estado emocional general: <span className="font-semibold text-soul-teal">Equilibrado</span></p>

          {/* Mood Selector */}
          <div className="mt-3 flex gap-2">
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setCurrentMood(m);
                  toast("Mood registrado: " + m, { icon: "📝" });
                }}
                className={`text-2xl p-1 rounded-full transition-all active:scale-90 ${
                  currentMood === m ? "bg-primary/20 scale-110 ring-2 ring-primary/50" : "hover:scale-110 hover:bg-card"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Biometric Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {biometrics.map((b) => (
            <button
              key={b.label}
              onClick={() => {
                setSelectedBio(selectedBio === b.label ? null : b.label);
                toast(`${b.label}: ${b.value}`, { icon: "📊" });
              }}
              className={`rounded-xl border bg-card p-3 text-left transition-all duration-300 active:scale-95 ${
                selectedBio === b.label ? "border-primary scale-[1.03] shadow-md shadow-primary/10" : "border-border hover:border-primary/50 hover:scale-[1.02]"
              }`}
            >
              <b.icon className={`h-4 w-4 ${b.color}`} />
              <p className="mt-2 text-lg font-bold text-foreground">{b.value}</p>
              <p className="text-xs text-muted-foreground">{b.label}</p>
              <span className={`mt-1 inline-block text-[10px] ${
                b.status === "Normal" || b.status === "Buena" ? "text-soul-teal" :
                b.status === "Bajo" || b.status === "Alerta" ? "text-soul-gold" : "text-muted-foreground"
              }`}>{b.status}</span>
              {selectedBio === b.label && (
                <p className="mt-2 text-[10px] text-muted-foreground animate-fade-in">
                  Última lectura hace 5 min
                </p>
              )}
            </button>
          ))}
        </div>

        {/* AI Log */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Registro IA</h2>
          <div className="mt-3 space-y-2">
            {aiLog.map((log, i) => (
              <button
                key={i}
                onClick={() => toast(log.msg, { icon: log.type === "positive" ? "✅" : log.type === "warning" ? "⚠️" : "🚨" })}
                className={`w-full rounded-xl border p-3 text-left transition-all active:scale-[0.97] hover:translate-x-1 ${
                  log.type === "alert" ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50" :
                  log.type === "warning" ? "border-soul-gold/30 bg-soul-gold/5 hover:border-soul-gold/50" :
                  "border-soul-teal/30 bg-soul-teal/5 hover:border-soul-teal/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-muted-foreground mt-0.5">{log.time}</span>
                  <p className="text-xs text-foreground">{log.msg}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
