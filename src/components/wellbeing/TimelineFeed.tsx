import type { TimelineEntry } from "@/lib/wellbeing.functions";

const KIND_META: Record<TimelineEntry["kind"], { icon: string; tone: string; label: string }> = {
  checkin: { icon: "📝", tone: "border-soul-teal/40", label: "Check-in" },
  task_completed: { icon: "✅", tone: "border-primary/40", label: "Tarea completada" },
  task_skipped: { icon: "⏭️", tone: "border-border", label: "Tarea omitida" },
  prediction_change: { icon: "📈", tone: "border-soul-gold/50", label: "Cambio de señal" },
  milestone: { icon: "🏆", tone: "border-soul-gold/50", label: "Hito" },
  world_change: { icon: "🌍", tone: "border-primary/30", label: "Mundo" },
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TimelineFeed({
  entries,
  className = "",
  limit,
}: {
  entries: TimelineEntry[];
  className?: string;
  limit?: number;
}) {
  const items = limit ? entries.slice(0, limit) : entries;

  if (items.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed border-border bg-card/30 p-6 text-center ${className}`}>
        <p className="text-sm text-muted-foreground">
          Aún no hay eventos. Completa una tarea o registra tu check-in para empezar tu historia.
        </p>
      </div>
    );
  }

  return (
    <ol className={`space-y-3 ${className}`}>
      {items.map((e, i) => {
        const meta = KIND_META[e.kind];
        return (
          <li key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="text-xl" aria-hidden="true">{meta.icon}</span>
              {i < items.length - 1 && <div className="mt-1 h-full min-h-6 w-0.5 bg-border" />}
            </div>
            <div className={`flex-1 rounded-xl border bg-card p-3 ${meta.tone}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{e.title}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatWhen(e.occurredAt)}</span>
              </div>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{meta.label}</p>
              {e.detail && <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
