import { useState } from "react";
import { X, Check } from "lucide-react";

interface Question {
  q: string;
  options: string[];
  correct: number;
  explain: string;
}

interface Props {
  onComplete: (score: number, total: number) => void;
  onClose: () => void;
}

const QUESTIONS: Question[] = [
  {
    q: "¿Qué técnica ayuda a calmar el sistema nervioso al instante?",
    options: ["Respiración 4-7-8", "Beber café", "Revisar redes"],
    correct: 0,
    explain: "Inhalar 4s, sostener 7s, exhalar 8s activa el sistema parasimpático.",
  },
  {
    q: "El mindfulness consiste principalmente en…",
    options: ["Vaciar la mente", "Observar sin juzgar", "Pensar en positivo"],
    correct: 1,
    explain: "Es atención plena al momento presente, sin reaccionar.",
  },
  {
    q: "La resiliencia se entrena con…",
    options: ["Evitar el malestar", "Exponerse y reflexionar", "Dormir más"],
    correct: 1,
    explain: "Afrontar y procesar dificultades fortalece la resiliencia.",
  },
];

export function QuizMission({ onComplete, onClose }: Props) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/95 backdrop-blur-sm animate-fade-in sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel text-lg font-bold text-foreground">🧠 Quiz de sabiduría</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
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
              <span className="text-[10px] text-muted-foreground">
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
          </div>
        )}
      </div>
    </div>
  );
}
