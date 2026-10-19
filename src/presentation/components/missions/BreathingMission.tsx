import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Props {
  cycles?: number;
  onComplete: () => void;
  onClose: () => void;
}

const PHASES = [
  { name: "Inhala", duration: 4000, scale: 1.4 },
  { name: "Sostén", duration: 4000, scale: 1.4 },
  { name: "Exhala", duration: 6000, scale: 0.8 },
  { name: "Pausa", duration: 2000, scale: 0.8 },
] as const;

export function BreathingMission({ cycles = 4, onComplete, onClose }: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (done) return;
    const phase = PHASES[phaseIndex];
    const t = setTimeout(() => {
      const next = phaseIndex + 1;
      if (next >= PHASES.length) {
        if (cycle >= cycles) {
          setDone(true);
        } else {
          setCycle((c) => c + 1);
          setPhaseIndex(0);
        }
      } else {
        setPhaseIndex(next);
      }
    }, phase.duration);
    return () => clearTimeout(t);
  }, [phaseIndex, cycle, cycles, done]);

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  const phase = PHASES[phaseIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-card p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
      >
        <X className="h-5 w-5" />
      </button>

      <p className="font-cinzel text-sm text-muted-foreground">
        Ciclo {cycle} / {cycles}
      </p>

      <div className="relative mt-6 flex h-64 w-64 items-center justify-center">
        <div
          className="absolute h-48 w-48 rounded-full bg-gradient-to-br from-primary/40 to-soul-teal/40 transition-transform ease-in-out"
          style={{
            transform: `scale(${phase.scale})`,
            transitionDuration: `${phase.duration}ms`,
          }}
        />
        <div
          className="absolute h-48 w-48 rounded-full border-2 border-primary/60 transition-transform ease-in-out"
          style={{
            transform: `scale(${phase.scale})`,
            transitionDuration: `${phase.duration}ms`,
          }}
        />
        <span className="relative text-2xl font-cinzel font-bold text-foreground">
          {done ? "✨" : phase.name}
        </span>
      </div>

      <p className="mt-8 max-w-xs text-center text-xs text-muted-foreground">
        {done ? "¡Sesión completada!" : "Sigue el ritmo de la esfera. Respira con calma."}
      </p>
    </div>
  );
}
