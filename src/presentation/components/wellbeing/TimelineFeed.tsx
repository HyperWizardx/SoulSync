import { CheckCircle2, Globe, NotebookPen, SkipForward, TrendingUp, Trophy, type LucideIcon } from "lucide-react";
import { displayTimelineTitle } from "@/domain/wellbeing/copy";
import type { TimelineEntry } from "@/service/server-functions/wellbeing.functions";

const KIND_META: Record<TimelineEntry["kind"], { Icon: LucideIcon; tone: string; label: string }> = {
  checkin: { Icon: NotebookPen, tone: "border-soul-teal/40", label: "Check-in" },
  task_completed: { Icon: CheckCircle2, tone: "border-primary/40", label: "Misión cumplida" },
  task_skipped: { Icon: SkipForward, tone: "border-border", label: "Misión omitida" },
  prediction_change: { Icon: TrendingUp, tone: "border-soul-gold/50", label: "Tu brújula cambió" },
  milestone: { Icon: Trophy, tone: "border-soul-gold/50", label: "Hito de tu aventura" },
  world_change: { Icon: Globe, tone: "border-primary/30", label: "Mundo" },
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
          Tu crónica está por escribirse. Completa una misión o haz tu check-in para empezarla.
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
              <meta.Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              {i < items.length - 1 && <div className="mt-1 h-full min-h-6 w-0.5 bg-border" />}
            </div>
            <div className={`flex-1 rounded-xl border bg-card p-3 ${meta.tone}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{displayTimelineTitle(e.title)}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{formatWhen(e.occurredAt)}</span>
              </div>
              {/* La etiqueta solo se muestra si el título no la repite ("Misión cumplida: …", "Check-in del día") */}
              {!e.title.toLowerCase().startsWith(meta.label.toLowerCase()) && (
                <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{meta.label}</p>
              )}
              {e.detail && <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
