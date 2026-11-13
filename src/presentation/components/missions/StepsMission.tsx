// Misión guiada por pasos: una lista corta que el estudiante va marcando (rutina de fuerza,
// plato del aventurero, paseo verde…). Se completa al marcar todos los pasos.
import { useState } from "react";
import { Check, X } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { tap } from "@/shared/haptics";

interface Props {
  title: string;
  icon: string;
  description: string;
  steps: readonly string[];
  source?: string;
  /** Índices de los pasos marcados. */
  onComplete: (done: number[]) => void;
  onClose: () => void;
}

export function StepsMission({ title, icon, description, steps, source, onComplete, onClose }: Props) {
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false));
  const count = done.filter(Boolean).length;
  const all = count === steps.length;

  const toggle = (i: number) => { tap(); setDone((d) => d.map((v, j) => (j === i ? !v : v))); };

  return (
    <div className="fixed inset-0 z-[58] flex items-end justify-center bg-background/95 backdrop-blur-sm animate-fade-in sm:items-center">
      <div className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="flex min-w-0 items-center gap-2 font-cinzel text-lg font-bold text-foreground">
            <GameIcon name={icon} className="h-5 w-5 shrink-0 text-primary" /> <span className="truncate">{title}</span>
          </h3>
          <button onClick={onClose} aria-label="Cerrar misión" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:text-foreground active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(count / steps.length) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{count}/{steps.length}</span>
        </div>

        <ol className="mt-4 space-y-2">
          {steps.map((step, i) => (
            <li key={step}>
              <button
                onClick={() => toggle(i)}
                aria-pressed={done[i]}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm transition-all active:scale-[0.98] ${done[i] ? "border-soul-teal/50 bg-soul-teal/10 text-foreground" : "border-border bg-background text-foreground hover:border-primary/50"}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${done[i] ? "border-soul-teal bg-soul-teal text-background" : "border-border text-muted-foreground"}`}>
                  {done[i] ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                </span>
                <span className={done[i] ? "text-muted-foreground line-through" : ""}>{step}</span>
              </button>
            </li>
          ))}
        </ol>

        {source && <p className="mt-3 text-xs text-muted-foreground">Basada en: {source}.</p>}

        <button
          disabled={!all}
          onClick={() => onComplete(done.flatMap((d, i) => (d ? [i] : [])))}
          className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-all active:scale-95 disabled:opacity-40"
        >
          {all ? "¡Misión lista!" : `Marca los ${steps.length - count} pasos que faltan`}
        </button>
      </div>
    </div>
  );
}
