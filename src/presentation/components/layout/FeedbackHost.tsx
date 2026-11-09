import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useEffect } from "react";
import { fireConfetti } from "@/shared/confetti";
import { onFeedback } from "@/shared/feedback";
import { getAchievement, REWARD_BY_RARITY, RARITY_LABEL } from "@/domain/gamification/achievements";
import { toast } from "sonner";
import { useState } from "react";
import { LevelUpModal } from "@/presentation/components/layout/LevelUpModal";
import { success as hapticSuccess, levelUp as hapticLevelUp } from "@/shared/haptics";
import { playSound } from "@/shared/sound";
import { RewardBurst } from "@/presentation/components/motion/RewardBurst";
import { MissionCompleteBanner } from "@/presentation/components/motion/MissionCompleteBanner";

export function FeedbackHost() {
  const [levelUp, setLevelUp] = useState<number | null>(null);

  useEffect(() => {
    return onFeedback((e) => {
      if (e.type === "levelup") {
        playSound("levelup");
        hapticLevelUp();
        setLevelUp(e.level);
      } else if (e.type === "achievement") {
        const ach = getAchievement(e.code);
        if (!ach) return;
        hapticSuccess();
        playSound("coin");
        const reward = REWARD_BY_RARITY[ach.rarity];
        const parts = [`+${reward.xp} XP`, `+${reward.coins} monedas`];
        if (reward.gems > 0) parts.push(`+${reward.gems} gemas`);
        if (ach.rarity === "epico" || ach.rarity === "legendario") {
          fireConfetti({ particleCount: 90, spread: 75, origin: { y: 0.3 } });
        }
        toast(`¡Nuevo logro ${RARITY_LABEL[ach.rarity].toLowerCase()}: ${ach.name}!`, {
          icon: <GameIcon name={ach.icon} className="h-5 w-5 text-soul-gold" />,
          description: `${ach.description} · ${parts.join(" · ")}`,
          duration: 5000,
        });
      }
    });
  }, []);


  return (
    <>
      <MissionCompleteBanner />
      <RewardBurst />
      {levelUp !== null && <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />}
    </>
  );
}
