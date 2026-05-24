import { useMemo } from "react";
import { Target, Check } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";

export function DailyGoalCard() {
  const { user } = useUserStore();
  const today = new Date().toDateString();
  const todayCount = useMemo(
    () => user.missionHistory.filter((m) => m.date === today).length,
    [user.missionHistory, today]
  );
  const goal = user.settings.dailyGoal;
  const pct = Math.min(100, (todayCount / goal) * 100);
  const done = todayCount >= goal;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        done
          ? "border-soul-teal/50 bg-soul-teal/10"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {done ? (
            <Check className="h-4 w-4 text-soul-teal" />
          ) : (
            <Target className="h-4 w-4 text-primary" />
          )}
          <p className="text-sm font-semibold text-foreground">
            Meta diaria
          </p>
        </div>
        <span
          className={`text-sm font-bold ${
            done ? "text-soul-teal" : "text-foreground"
          }`}
        >
          {todayCount} / {goal}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            done ? "bg-soul-teal" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {done
          ? "¡Meta cumplida! Sigue así para mantener tu racha 🔥"
          : `Completa ${goal - todayCount} misión${
              goal - todayCount === 1 ? "" : "es"
            } más hoy.`}
      </p>
    </div>
  );
}
