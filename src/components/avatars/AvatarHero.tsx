import { useRef, useState } from "react";
import { AvatarIcon, AVATAR_META, type AvatarMood } from "@/components/avatars/AvatarArt";

const PHRASES: string[][] = [
  ["¡Tu magia interior crece! ✨", "Un hechizo de calma para ti", "Las mejores pociones toman tiempo"],
  ["El bosque cree en ti 🌿", "Respira como el viento entre hojas", "Cada paso abre un nuevo sendero"],
  ["¡Tu valentía es imparable! 🔥", "Los dragones también descansan", "Hoy es un buen día para volar alto"],
  ["Astuto como siempre 🦊", "Cada reto es una pista nueva", "Sigamos explorando juntos"],
  ["Brillas más de lo que crees ⭐", "Eres luz incluso en la niebla", "Sigue tu propia constelación"],
  ["La sabiduría llega con calma 🦉", "Un paso hoy, un gran vuelo mañana", "Escucha lo que necesitas"],
];

const MOOD_LABEL: Record<AvatarMood, string> = {
  radiant: "Radiante",
  balanced: "Equilibrado",
  tired: "Cansado, dale un respiro",
};

export function computeMood(stats: { bienestar: number; resiliencia: number; energia: number; claridad: number }): AvatarMood {
  const avg = (stats.bienestar + stats.resiliencia + stats.energia + stats.claridad) / 4;
  if (avg >= 66) return "radiant";
  if (avg >= 33) return "balanced";
  return "tired";
}

interface AvatarHeroProps {
  index: number;
  mood: AvatarMood;
  size?: number;
  showMoodLabel?: boolean;
}

/** Avatar 2D grande e interactivo: reacciona al tocarlo y refleja el estado real del usuario. */
export function AvatarHero({ index, mood, size = 176, showMoodLabel = true }: AvatarHeroProps) {
  const [bounce, setBounce] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const safeIndex = ((index % AVATAR_META.length) + AVATAR_META.length) % AVATAR_META.length;
  const meta = AVATAR_META[safeIndex];

  const handleTap = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setBounce(true);
    const pool = PHRASES[safeIndex];
    setBubble(pool[Math.floor(Math.random() * pool.length)]);

    timers.current.push(setTimeout(() => setBounce(false), 500));
    timers.current.push(setTimeout(() => setBubble(null), 2600));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {bubble && (
          <div className="absolute -top-3 left-1/2 z-10 w-max max-w-[190px] -translate-x-1/2 -translate-y-full animate-fade-in rounded-2xl border border-border bg-card px-3 py-2 text-center text-xs font-medium text-foreground shadow-lg">
            {bubble}
            <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-card" />
          </div>
        )}
        <button
          type="button"
          onClick={handleTap}
          aria-label={`Interactuar con ${meta.name}`}
          className={`transition-transform duration-300 ease-out active:scale-95 ${bounce ? "-translate-y-3 scale-110" : "translate-y-0 scale-100"}`}
        >
          <AvatarIcon index={safeIndex} size={size} mood={mood} glow selected />
        </button>
      </div>
      <p className="mt-3 font-cinzel text-lg font-bold text-foreground">{meta.name}</p>
      <p className="text-xs text-muted-foreground">{meta.title}</p>
      {showMoodLabel && (
        <span
          className={`mt-2 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
            mood === "radiant"
              ? "border-soul-gold/40 bg-soul-gold/10 text-soul-gold"
              : mood === "tired"
              ? "border-border bg-card text-muted-foreground"
              : "border-soul-teal/40 bg-soul-teal/10 text-soul-teal"
          }`}
        >
          {MOOD_LABEL[mood]}
        </span>
      )}
    </div>
  );
}
