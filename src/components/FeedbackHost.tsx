import { useEffect } from "react";
import { onFeedback } from "@/lib/feedback";
import { getAchievement } from "@/lib/achievements";
import { toast } from "sonner";
import { useState } from "react";
import { LevelUpModal } from "@/components/LevelUpModal";
import { success as hapticSuccess } from "@/lib/haptics";

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
        toast(`${ach.emoji}  ¡Logro desbloqueado!`, {
          description: `${ach.name} — ${ach.description}`,
          duration: 4500,
        });
      }
    });
  }, []);

  if (levelUp !== null) {
    return <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />;
  }
  return null;
}
