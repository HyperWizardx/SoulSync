import { Angry, Annoyed, Frown, Laugh, Meh, Smile } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  onComplete: (entry: string, mood: string) => void;
  onClose: () => void;
  /** Título, ícono y preguntas guía de la misión abierta (por defecto, el Diario emocional). */
  title?: string;
  icon?: string;
  prompts?: readonly string[];
}

const MOODS = [
  { label: "Alegría", Icon: Laugh },
  { label: "Calma", Icon: Smile },
  { label: "Neutral", Icon: Meh },
  { label: "Tristeza", Icon: Frown },
  { label: "Enojo", Icon: Angry },
  { label: "Agobio", Icon: Annoyed },
];
const PROMPTS = [
  "¿Qué emoción predomina hoy y de dónde crees que viene?",
  "Describe un momento del día que te haya hecho sentir presente.",
  "¿Qué pensamiento te ha rondado más y cómo lo afrontaste?",
];

export function JournalMission({ onComplete, onClose, title = "Diario emocional", icon = "notebook", prompts = PROMPTS }: Props) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("Alegría");
  const [prompt] = useState(() => prompts[Math.floor(Math.random() * prompts.length)]);

  const minChars = 30;
  const valid = text.trim().length >= minChars;

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

        <p className="mt-3 text-xs text-muted-foreground">¿Cómo te sientes ahora?</p>
        {/* Seis estados en una fila que se reparte el ancho: no se corta en pantallas angostas. */}
        <div className="mt-2 grid grid-cols-6 gap-1">
          {MOODS.map(({ label, Icon }) => (
            <button
              key={label}
              onClick={() => setMood(label)}
              aria-label={label}
              aria-pressed={mood === label}
              title={label}
              className={`flex aspect-square items-center justify-center rounded-full transition-all active:scale-90 ${
                mood === label ? "bg-primary/20 text-primary scale-110 ring-2 ring-primary/50" : "text-muted-foreground hover:scale-110"
              }`}
            >
              <Icon className="h-6 w-6" />
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold text-primary">{prompt}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe libremente..."
          rows={5}
          className="mt-2 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{text.trim().length} / {minChars} mín.</span>
          <span>{valid ? "¡Listo!" : "Sigue escribiendo"}</span>
        </div>

        <button
          disabled={!valid}
          onClick={() => onComplete(text, mood)}
          className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90"
        >
          Guardar entrada
        </button>
      </div>
    </div>
  );
}
