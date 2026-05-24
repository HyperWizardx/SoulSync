import { useWeeklyStats } from "@/hooks/useUserStore";

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

export function WeeklyChart() {
  const { data, isLoading } = useWeeklyStats();

  if (isLoading || !data) {
    return (
      <div className="h-32 rounded-xl border border-border bg-card/50 animate-pulse" />
    );
  }

  const max = Math.max(1, ...data.map((d) => d.xp));

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex h-28 items-end justify-between gap-1.5">
        {data.map((d) => {
          const h = (d.xp / max) * 100;
          const date = new Date(d.date);
          const label = DAY_LABELS[date.getDay()];
          return (
            <div
              key={d.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-primary to-soul-teal transition-all duration-700"
                  style={{ height: `${Math.max(h, 4)}%` }}
                  title={`${d.xp} XP`}
                />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Últimos 7 días</span>
        <span className="font-semibold text-soul-gold">
          {data.reduce((a, b) => a + b.xp, 0)} XP totales
        </span>
      </div>
    </div>
  );
}
