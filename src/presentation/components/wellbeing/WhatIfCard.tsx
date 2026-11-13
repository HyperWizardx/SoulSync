// "¿Y si…?" del estudiante: elige hábitos y mira cómo cambiaría tu brújula con el mismo modelo.
// No guarda nada; es orientativo y solo muestra la dirección del cambio.
import { useMemo, useState } from "react";
import { Check, Wand2 } from "lucide-react";
import type { WellbeingPrediction } from "@/domain/wellbeing/types";
import type { TrainedParams } from "@/domain/wellbeing/trainedLogistic";
import { resolveActiveModel } from "@/domain/wellbeing/trainedLogistic";
import { availableLevers, runWhatIf, scenarioFromExplanation, type LeverKey } from "@/application/wellbeing/whatIf";

export function WhatIfCard({ prediction, params, checkinCount }: { prediction: WellbeingPrediction; params: TrainedParams | null; checkinCount: number }) {
  const model = useMemo(() => resolveActiveModel(params), [params]);
  const base = useMemo(() => scenarioFromExplanation(prediction.explanation), [prediction.explanation]);
  const levers = useMemo(() => availableLevers(base), [base]);
  const [active, setActive] = useState<Set<LeverKey>>(new Set());
  const result = useMemo(() => runWhatIf(model, base, active, Math.max(5, checkinCount)), [model, base, active, checkinCount]);

  if (levers.length === 0 || result.before === null || prediction.score === null) return null;
  // Se ancla al índice que el estudiante ve en su brújula y se resta la mejora simulada.
  const today = prediction.score;
  const after = Math.max(0, today - result.improvement / 100);
  const toggle = (k: LeverKey) => setActive((prev) => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const pct = (v: number | null) => (v === null ? 0 : Math.round(v * 100));
  const message = active.size === 0
    ? "Elige uno o varios hábitos para ver cómo cambiaría tu brújula."
    : result.improvement >= 1
      ? `Tu índice bajaría unos ${result.improvement} puntos.`
      : "Esos hábitos ya van bien encaminados: casi no moverían tu brújula.";

  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-label="¿Y si…?">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-cinzel font-semibold text-foreground">¿Y si…?</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Imagina tu próxima semana con estos hábitos. Usa el mismo modelo de tu brújula.</p>

      <ul className="mt-3 space-y-2">
        {levers.map(({ lever, good }) => {
          const on = active.has(lever.key);
          return (
            <li key={lever.key}>
              <button
                onClick={() => toggle(lever.key)}
                aria-pressed={on}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${on ? "border-primary bg-primary/10" : "border-border"}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{lever.label}</span>
                  <span className="block text-xs text-muted-foreground">{good ? "Ya lo estás haciendo bien" : lever.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-1.5" aria-live="polite">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Hoy</span><span>{pct(today)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          <div className="h-full rounded-full bg-soul-gold/70" style={{ width: `${pct(today)}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Con tus hábitos</span><span className="font-semibold text-foreground">{pct(after)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          <div className="h-full rounded-full bg-soul-teal transition-all duration-500" style={{ width: `${pct(after)}%` }} />
        </div>
        <p className="pt-1 text-sm font-medium text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">Simulación orientativa, no una promesa ni un diagnóstico. No se guarda.</p>
      </div>
    </section>
  );
}
