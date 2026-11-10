import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useState } from "react";
import { X, Check } from "lucide-react";
import type { QuizQuestion } from "@/domain/gamification/quizzes";

interface Props {
  onComplete: (score: number, total: number) => void;
  onClose: () => void;
  title?: string;
  icon?: string;
  /** Preguntas de este quiz (ver domain/gamification/quizzes). */
  questions: readonly QuizQuestion[];
}

export function QuizMission({ onComplete, onClose, title = "Quiz de atención plena", icon = "brain", questions: QUESTIONS }: Props) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[idx];

  const next = () => {
    if (idx + 1 >= QUESTIONS.length) {
      setDone(true);
      onComplete(score + (selected === q.correct ? 1 : 0), QUESTIONS.length);
    } else {
      if (selected === q.correct) setScore((s) => s + 1);
      setIdx((i) => i + 1);
      setSelected(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[58] flex items-end justify-center bg-background/95 backdrop-blur-sm animate-fade-in sm:items-center">
      <div className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="flex min-w-0 items-center gap-2 font-cinzel text-lg font-bold text-foreground"><GameIcon name={icon} className="h-5 w-5 shrink-0 text-primary" /> <span className="truncate">{title}</span></h3>
          <button
            onClick={onClose}
            aria-label="Cerrar misión"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground active:scale-90 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!done ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${((idx + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {idx + 1}/{QUESTIONS.length}
              </span>
            </div>

            <p className="mt-4 text-sm font-semibold text-foreground">{q.q}</p>

            <div className="mt-3 space-y-2">
              {q.options.map((opt, i) => {
                const isSel = selected === i;
                const showResult = selected !== null;
                const isCorrect = i === q.correct;
                return (
                  <button
                    key={opt}
                    disabled={showResult}
                    onClick={() => setSelected(i)}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition-all active:scale-[0.98] ${
                      showResult && isCorrect
                        ? "border-soul-teal bg-soul-teal/10 text-foreground"
                        : showResult && isSel && !isCorrect
                        ? "border-destructive bg-destructive/10 text-foreground"
                        : isSel
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background hover:border-primary/50 text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <p className="mt-3 text-xs text-muted-foreground animate-fade-in">{q.explain}</p>
            )}

            <button
              disabled={selected === null}
              onClick={next}
              className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-all active:scale-95 disabled:opacity-40 hover:bg-primary/90"
            >
              {idx + 1 >= QUESTIONS.length ? "Finalizar" : "Siguiente"}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center py-8">
            <Check className="h-12 w-12 text-soul-teal" />
            <p className="mt-3 font-cinzel text-xl font-bold text-foreground">¡Quiz completado!</p>
            <p className="mt-1 text-sm text-muted-foreground">Cada respuesta suma sabiduría a tu héroe.</p>
          </div>
        )}
      </div>
    </div>
  );
}
