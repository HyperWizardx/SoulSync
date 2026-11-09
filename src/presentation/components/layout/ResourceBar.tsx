// Barra de recursos del jugador (racha, monedas y gemas) con el mismo lugar y aspecto en
// Inicio y Misiones. Las monedas y gemas llevan a la Tienda, donde se gastan.
import { Link } from "@tanstack/react-router";
import { Coins, Flame, Gem } from "lucide-react";
import { AnimatedNumber } from "@/presentation/components/motion/AnimatedNumber";

interface Props {
  streak: number;
  coins: number;
  gems: number;
  className?: string;
}

export function ResourceBar({ streak, coins, gems, className = "" }: Props) {
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <div className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-soul-gold/30 bg-soul-gold/5 p-2" aria-label={`Racha de ${streak} días`}>
        <Flame className="h-4 w-4 text-soul-gold" aria-hidden="true" />
        <span className="text-sm font-bold text-soul-gold">{streak}d</span>
      </div>
      <Link to="/store" aria-label={`${coins} monedas, abrir la Tienda`} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border bg-card p-2 transition-transform active:scale-95">
        <Coins className="h-4 w-4 text-soul-gold" aria-hidden="true" />
        <span className="text-sm font-bold"><AnimatedNumber value={coins} /></span>
      </Link>
      <Link to="/store" aria-label={`${gems} gemas, abrir la Tienda`} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border bg-card p-2 transition-transform active:scale-95">
        <Gem className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-bold text-primary"><AnimatedNumber value={gems} /></span>
      </Link>
    </div>
  );
}
