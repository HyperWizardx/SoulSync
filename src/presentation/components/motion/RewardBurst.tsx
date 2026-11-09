// Al completar una misión, las recompensas (+XP, monedas, gemas) suben flotando desde el centro
// de la pantalla hacia los contadores y se desvanecen.
import { useEffect, useState } from "react";
import { m } from "motion/react";
import { Coins, Gem, Sparkles } from "lucide-react";
import { onFeedback, rewardChips } from "@/shared/feedback";

type Burst = { id: number; chips: ReturnType<typeof rewardChips> };
const ICONS = { xp: Sparkles, coins: Coins, gems: Gem } as const;
const TONE = { xp: "text-soul-gold", coins: "text-soul-gold", gems: "text-primary" } as const;

export function RewardBurst() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  useEffect(() => onFeedback((e) => {
    if (e.type !== "reward") return;
    const burst = { id: Date.now(), chips: rewardChips(e) };
    setBursts((b) => [...b, burst]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== burst.id)), 1600);
  }), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center" aria-live="polite">
      {bursts.map((burst) => (
        <div key={burst.id} className="absolute flex gap-2">
          {burst.chips.map((chip, i) => {
            const Icon = ICONS[chip.kind];
            return (
              <m.span
                key={chip.kind}
                className={`flex items-center gap-1 rounded-full border border-border bg-card/95 px-3 py-1.5 text-sm font-bold shadow-lg ${TONE[chip.kind]}`}
                initial={{ opacity: 0, y: 24, scale: 0.6 }}
                animate={{ opacity: [0, 1, 1, 0], y: [24, 0, -40, -220], scale: [0.6, 1.1, 1, 0.8] }}
                transition={{ duration: 1.4, delay: i * 0.08, times: [0, 0.2, 0.55, 1], ease: "easeOut" }}
              >
                <Icon className="h-4 w-4" aria-hidden /> {chip.label}
              </m.span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
