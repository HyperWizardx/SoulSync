import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";

interface Props {
  title: string;
  emoji: string;
  /** Segundos. Para el prototipo usamos valores cortos. */
  durationSec: number;
  description: string;
  onComplete: () => void;
  onClose: () => void;
}

export function TimerMission({ title, emoji, durationSec, description, onComplete, onClose }: Props) {
  const [remaining, setRemaining] = useState(durationSec);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, done]);

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  const pct = ((durationSec - remaining) / durationSec) * 100;
  const mm = Math.floor(remaining / 60);
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-card p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
      >
        <X className="h-5 w-5" />
      </button>

      <span className="text-6xl">{emoji}</span>
      <h3 className="mt-3 font-cinzel text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">{description}</p>

      <div className="relative mt-8 h-48 w-48">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" className="fill-none stroke-secondary" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="46"
            className="fill-none stroke-primary transition-all duration-1000"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 289} 289`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-cinzel text-3xl font-bold text-foreground">
            {done ? "✓" : `${mm}:${ss}`}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {done ? "Completado" : running ? "En curso" : "Pausado"}
          </span>
        </div>
      </div>

      {!done && (
        <button
          onClick={() => setRunning((r) => !r)}
          className="mt-8 flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pausar" : "Continuar"}
        </button>
      )}
    </div>
  );
}
