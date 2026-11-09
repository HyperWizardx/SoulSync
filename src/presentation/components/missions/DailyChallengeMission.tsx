import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useMemo, useState } from "react";
import { X, Check, RefreshCw } from "lucide-react";
import { tap, success } from "@/shared/haptics";

const CHALLENGES = [
  { icon: "sunflower", title: "Sonríe a un desconocido", desc: "Un pequeño gesto que ilumina dos días." },
  { icon: "scroll-quill", title: "Escribe 1 cosa nueva sobre ti", desc: "Algo que descubriste recientemente." },
  { icon: "phone", title: "Llama a alguien que extrañas", desc: "Aunque sea 2 minutos." },
  { icon: "oak-leaf", title: "Toca una planta o árbol", desc: "Conéctate con la naturaleza." },
  { icon: "water-drop", title: "Bebe un vaso de agua ahora", desc: "Hidratarse es autocuidado." },
  { icon: "bookshelf", title: "Lee algo inspirador 5 min", desc: "Una página, un poema, una idea." },
  { icon: "prayer", title: "Agradece en voz alta", desc: "Por algo simple del día." },
  { icon: "walk", title: "Camina sin móvil 3 min", desc: "Solo tú y tus pasos." },
  { icon: "musical-notes", title: "Escucha 1 canción favorita", desc: "Solo presente, sin distracciones." },
  { icon: "body-balance", title: "Estírate 1 minuto", desc: "Tu cuerpo te lo agradecerá." },
];

interface Props {
  onComplete: (title: string) => void;
  onClose: () => void;
}

export function DailyChallengeMission({ onComplete, onClose }: Props) {
  // Reto diario determinista por fecha
  const todaySeed = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 1000 + d.getMonth() * 50 + d.getDate();
  }, []);
  const [idx, setIdx] = useState(todaySeed % CHALLENGES.length);
  const challenge = CHALLENGES[idx];
  const [done, setDone] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in px-6">
      <button
        onClick={onClose}
        aria-label="Cerrar reto"
        className="absolute top-4 right-4 rounded-full bg-card p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X className="h-5 w-5" />
      </button>

      <p className="font-cinzel text-sm text-muted-foreground">Reto del día</p>

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-soul-teal/10 p-6 text-center animate-fade-in" key={idx}>
        <GameIcon name={challenge.icon} className="h-16 w-16 text-primary" />
        <h2 className="mt-4 font-cinzel text-xl font-bold text-foreground">{challenge.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{challenge.desc}</p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => { tap(); setIdx((i) => (i + 1) % CHALLENGES.length); }}
          aria-label="Cambiar reto"
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm text-foreground hover:border-primary transition-all active:scale-95 min-h-[44px]"
        >
          <RefreshCw className="h-4 w-4" /> Otro
        </button>
        <button
          onClick={() => { if (done) return; setDone(true); success(); onComplete(challenge.title); }}
          aria-label="Marcar como cumplido"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 min-h-[44px]"
        >
          <Check className="h-4 w-4" /> ¡Cumplido!
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground max-w-xs">
        Hazlo ahora mismo o durante el día. Marca cumplido cuando lo logres.
      </p>
    </div>
  );
}
