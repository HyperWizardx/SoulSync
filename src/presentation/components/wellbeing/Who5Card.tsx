// "Pergamino del bienestar": la escala WHO-5 de la OMS, una afirmación a la vez (cada 14 días).
// Cuando no toca, muestra el último resultado con un mensaje amable y cuándo vuelve.
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { WHO5_BAND_COPY, WHO5_ITEMS, WHO5_OPTIONS, who5Band, who5DaysLeft, who5Due, who5Percent } from "@/domain/wellbeing/who5";

interface Props {
  lastScale: { raw: number; answeredAt: string } | null;
  today: string;
  pending: boolean;
  onSubmit: (answers: number[]) => void;
}

export function Who5Card({ lastScale, today, pending, onSubmit }: Props) {
  const due = who5Due(lastScale?.answeredAt, today);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const step = answers.length;

  // Resultado vigente: aún no toca responder otra vez.
  if (!due && lastScale) {
    const band = who5Band(lastScale.raw);
    const copy = WHO5_BAND_COPY[band];
    const left = who5DaysLeft(lastScale.answeredAt, today);
    return (
      <section className="rounded-2xl border border-soul-gold/30 bg-soul-gold/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-soul-gold">
            <GameIcon name="scroll-quill" className="h-4 w-4" /> Pergamino del bienestar
          </p>
          <span className="font-cinzel text-xl font-bold text-foreground">{who5Percent(lastScale.raw)}<span className="text-xs text-muted-foreground">/100</span></span>
        </div>
        <p className="mt-1 font-cinzel font-semibold text-foreground">{copy.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{copy.body}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          El próximo pergamino llega en {left} {left === 1 ? "día" : "días"}.
        </p>
      </section>
    );
  }

  if (!started) {
    return (
      <button
        onClick={() => setStarted(true)}
        className="flex w-full min-h-11 items-center gap-3 rounded-2xl border-2 border-soul-gold/40 bg-soul-gold/5 p-4 text-left transition-transform active:scale-[0.98]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soul-gold/15 text-soul-gold"><GameIcon name="scroll-quill" className="h-6 w-6" /></span>
        <span className="flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-soul-gold">Nuevo pergamino del bienestar</span>
          <span className="block text-sm font-semibold text-foreground">5 preguntas sobre tus últimas dos semanas</span>
          <span className="block text-xs text-muted-foreground">Toma 1 minuto · escala WHO-5 de la OMS</span>
        </span>
      </button>
    );
  }

  const answer = (value: number) => {
    const next = [...answers, value];
    if (next.length === WHO5_ITEMS.length) {
      onSubmit(next);
      setStarted(false);
      setAnswers([]);
    } else {
      setAnswers(next);
    }
  };

  return (
    <section className="rounded-2xl border border-soul-gold/40 bg-card p-4" aria-live="polite">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-soul-gold">
          <GameIcon name="scroll-quill" className="h-4 w-4" /> Pergamino del bienestar
        </p>
        <span className="text-xs text-muted-foreground">{step + 1} de {WHO5_ITEMS.length}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-soul-gold transition-all duration-500" style={{ width: `${(step / WHO5_ITEMS.length) * 100}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Durante las últimas dos semanas…</p>
      <p className="mt-1 font-semibold text-foreground">{WHO5_ITEMS[step]}</p>
      <div className="mt-3 space-y-2" role="group" aria-label={WHO5_ITEMS[step]}>
        {WHO5_OPTIONS.map((o) => (
          <button
            key={o.value}
            disabled={pending}
            onClick={() => answer(o.value)}
            className="flex min-h-11 w-full items-center rounded-xl border border-border bg-secondary/40 px-4 text-left text-sm text-foreground transition-all hover:border-soul-gold/60 active:scale-[0.98] disabled:opacity-50"
          >
            {o.label}
          </button>
        ))}
      </div>
      {step > 0 && (
        <button onClick={() => setAnswers(answers.slice(0, -1))} className="mt-3 flex min-h-11 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Pregunta anterior
        </button>
      )}
    </section>
  );
}
