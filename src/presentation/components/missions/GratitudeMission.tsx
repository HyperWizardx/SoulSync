import { useState } from "react";
import { X, Sparkles } from "lucide-react";

interface Props {
  onComplete: (items: string[]) => void;
  onClose: () => void;
  title?: string;
  hint?: string;
}

export function GratitudeMission({ onComplete, onClose, title = "3 Gratitudes", hint = "Escribe tres cosas, personas o momentos por los que te sientas agradecido hoy." }: Props) {
  const [items, setItems] = useState<string[]>(["", "", ""]);

  const valid = items.every((i) => i.trim().length >= 3);

  return (
    <div className="fixed inset-0 z-[58] flex items-end justify-center bg-background/95 backdrop-blur-sm animate-fade-in sm:items-center">
      <div className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-cinzel text-lg font-bold text-foreground">
            <Sparkles className="h-5 w-5 text-soul-gold" /> {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar misión"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground active:scale-90 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {hint}
        </p>

        <div className="mt-4 space-y-3">
          {items.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soul-gold/20 text-sm font-bold text-soul-gold">
                {i + 1}
              </span>
              <input
                value={v}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  setItems(next);
                }}
                placeholder={`Agradezco por...`}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-soul-gold focus:outline-none focus:ring-2 focus:ring-soul-gold/30"
              />
            </div>
          ))}
        </div>

        <button
          disabled={!valid}
          onClick={() => onComplete(items)}
          className="mt-5 w-full rounded-xl bg-soul-gold py-3 font-semibold text-background transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-soul-gold/90"
        >
          Sellar gratitud <Sparkles className="inline h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
