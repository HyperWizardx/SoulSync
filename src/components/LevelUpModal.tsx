import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";
import { MiniAvatar3D } from "@/components/MiniAvatar3D";
import { useUserStore } from "@/hooks/useUserStore";
import { getArchetypeStyle } from "@/lib/archetype";
import { levelUp as hapticLevelUp } from "@/lib/haptics";

interface Props {
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: Props) {
  const { user } = useUserStore();
  const style = getArchetypeStyle(user.archetype);

  useEffect(() => {
    hapticLevelUp();
    const burst = (x: number) =>
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x, y: 0.4 },
        colors: ["#a855f7", "#22d3ee", "#fbbf24", "#f472b6"],
      });
    burst(0.3);
    setTimeout(() => burst(0.7), 200);
    setTimeout(() => burst(0.5), 400);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Subiste a nivel ${level}`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-sm w-full rounded-3xl border-2 border-primary/40 bg-gradient-to-b from-card via-card to-primary/10 p-6 text-center shadow-2xl shadow-primary/30 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-soul-gold px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-background">
          ¡Nivel arriba!
        </div>

        <div className="mt-4 flex justify-center">
          <div className="relative">
            <MiniAvatar3D size={160} glowColor={style.glow} exposure={style.exposure + 0.2} />
            <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-soul-gold animate-pulse" />
            <Sparkles className="absolute -left-2 -bottom-2 h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>

        <h2 className="mt-4 font-cinzel text-3xl font-bold text-foreground">
          Nivel {level}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ¡Tu energía interior crece! Nuevos retos te esperan.
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all active:scale-95 hover:brightness-110 min-h-11"
        >
          ¡Continuar mi camino!
        </button>
      </div>
    </div>
  );
}
