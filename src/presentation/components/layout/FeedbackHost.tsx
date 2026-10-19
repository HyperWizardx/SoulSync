import { useEffect } from "react";
import confetti from "canvas-confetti";
import { onFeedback } from "@/shared/feedback";
import { getAchievement, REWARD_BY_RARITY, RARITY_LABEL } from "@/domain/gamification/achievements";
import { toast } from "sonner";
import { useState } from "react";
import { LevelUpModal } from "@/presentation/components/layout/LevelUpModal";
import { success as hapticSuccess } from "@/shared/haptics";

export function FeedbackHost() {
  const [levelUp, setLevelUp] = useState<number | null>(null);

  useEffect(() => {
    return onFeedback((e) => {
      if (e.type === "levelup") {
        setLevelUp(e.level);
      } else if (e.type === "achievement") {
        const ach = getAchievement(e.code);
        if (!ach) return;
        hapticSuccess();
        const reward = REWARD_BY_RARITY[ach.rarity];
        const parts = [`+${reward.xp} XP`, `+${reward.coins} 🪙`];
        if (reward.gems > 0) parts.push(`+${reward.gems} 💎`);
        if (ach.rarity === "epico" || ach.rarity === "legendario") {
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.3 } });
        }
        toast(`${ach.emoji}  ¡Logro ${RARITY_LABEL[ach.rarity]} desbloqueado!`, {
          description: `${ach.name} — ${ach.description}\n${parts.join(" · ")}`,
          duration: 5000,
        });
      }
    });
  }, []);


  if (levelUp !== null) {
    return <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />;
  }
  return null;
}
