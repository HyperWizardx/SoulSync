import { useEffect, useRef, useState } from "react";
import { X, Pause, Play } from "lucide-react";
import { tap } from "@/lib/haptics";

interface Props {
  durationSec?: number;
  onComplete: () => void;
  onClose: () => void;
}

const STEPS = [
  "Cierra los ojos suavemente.",
  "Siente tu respiración natural.",
  "Relaja los hombros y la mandíbula.",
  "Observa los pensamientos sin juzgar.",
  "Vuelve a tu respiración con calma.",
  "Conecta con la quietud interior.",
];

export function MeditationMission({ durationSec = 120, onComplete, onClose }: Props) {
  const [remaining, setRemaining] = useState(durationSec);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (paused || remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, paused]);

  useEffect(() => {
    const idx = Math.min(STEPS.length - 1, Math.floor(((durationSec - remaining) / durationSec) * STEPS.length));
    if (idx !== step) {
      setStep(idx);
      tap();
      try {
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(STEPS[idx]);
          u.lang = "es-ES"; u.rate = 0.9; u.volume = 0.7;
          window.speechSynthesis.speak(u);
        }
      } catch { /* noop */ }
    }
  }, [remaining, durationSec, step]);

  useEffect(() => {
    if (remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
      onComplete();
    }
  }, [remaining, onComplete]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = ((durationSec - remaining) / durationSec) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in px-6">
      <button
        onClick={() => { try { window.speechSynthesis?.cancel(); } catch { /* noop */ } onClose(); }}
        aria-label="Cerrar meditación"
        className="absolute top-4 right-4 rounded-full bg-card p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X className="h-5 w-5" />
      </button>

      <p className="font-cinzel text-sm text-muted-foreground">Meditación guiada</p>
      <div className="mt-6 relative h-56 w-56 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-soul-teal/30 animate-pulse" />
        <div className="absolute inset-4 rounded-full border-2 border-primary/40" />
        <span className="relative text-4xl font-cinzel font-bold text-foreground">{mm}:{ss}</span>
      </div>

      <p className="mt-8 max-w-xs text-center text-base text-foreground font-medium animate-fade-in" key={step}>
        🧘 {STEPS[step]}
      </p>

      <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-soul-teal transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>

      <button
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Reanudar" : "Pausar"}
        className="mt-6 flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm text-foreground hover:border-primary transition-all min-h-[44px]"
      >
        {paused ? <><Play className="h-4 w-4" /> Reanudar</> : <><Pause className="h-4 w-4" /> Pausar</>}
      </button>
    </div>
  );
}
