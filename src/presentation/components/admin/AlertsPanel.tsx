// Alertas priorizadas del panel de psicología: urgente → atención → vigilar, con el
// seguimiento pendiente resaltado. Cada alerta abre la ficha del estudiante.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, BellRing, CheckCircle2, ChevronRight, Eye } from "lucide-react";
import type { AlertPriority, StudentAlert } from "@/service/server-functions/admin.functions";
import { FOLLOW_UP_WINDOW_DAYS } from "@/domain/research/alerts";

export const PRIORITY_STYLE: Record<AlertPriority, { label: string; chip: string; Icon: typeof AlertTriangle }> = {
  urgente: { label: "Urgente", chip: "bg-destructive/15 text-destructive", Icon: AlertTriangle },
  atencion: { label: "Atención", chip: "bg-amber-500/15 text-amber-500", Icon: BellRing },
  vigilar: { label: "Vigilar", chip: "bg-sky-500/15 text-sky-500", Icon: Eye },
};

/** Texto del estado del seguimiento según la ventana de su prioridad. */
export function followUpText(a: Pick<StudentAlert, "priority" | "daysSinceFollowUp" | "followUpPending">) {
  if (a.daysSinceFollowUp === null) return "Seguimiento pendiente · sin registros";
  const when = a.daysSinceFollowUp === 0 ? "hoy" : a.daysSinceFollowUp === 1 ? "ayer" : `hace ${a.daysSinceFollowUp} días`;
  return a.followUpPending
    ? `Seguimiento pendiente · último ${when} (ventana ${FOLLOW_UP_WINDOW_DAYS[a.priority]} d)`
    : `Seguimiento al día · ${when}`;
}

const COLLAPSED = 6;

export function AlertsPanel({ alerts }: { alerts: StudentAlert[] }) {
  const [showAll, setShowAll] = useState(false);
  const pending = alerts.filter((a) => a.followUpPending).length;
  const counts = { urgente: 0, atencion: 0, vigilar: 0 } as Record<AlertPriority, number>;
  for (const a of alerts) counts[a.priority] += 1;
  const visible = showAll ? alerts : alerts.slice(0, COLLAPSED);

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-4" aria-labelledby="alerts-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="alerts-title" className="font-semibold text-foreground">Alertas priorizadas</h2>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {(Object.keys(PRIORITY_STYLE) as AlertPriority[]).map((p) => (
            <span key={p} className={`rounded-full px-2 py-0.5 ${PRIORITY_STYLE[p].chip}`}>{PRIORITY_STYLE[p].label}: {counts[p]}</span>
          ))}
          <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">Pendientes: {pending}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Solo estudiantes con consentimiento vigente. Ventana de seguimiento: urgente {FOLLOW_UP_WINDOW_DAYS.urgente} días, atención {FOLLOW_UP_WINDOW_DAYS.atencion}, vigilar {FOLLOW_UP_WINDOW_DAYS.vigilar}.
      </p>

      {alerts.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No hay alertas activas en este momento.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {visible.map((a) => {
            const s = PRIORITY_STYLE[a.priority];
            return (
              <li key={a.userId}>
                <Link
                  to="/admin/estudiante/$id"
                  params={{ id: a.userId }}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40 ${a.followUpPending ? "border-border" : "border-border/50 opacity-75"}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.chip}`}>
                    <s.Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className="truncate text-sm font-semibold text-foreground">{a.name}</span>
                      <span className="text-xs text-muted-foreground">{a.participantCode}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${s.chip}`}>{s.label}</span>
                    </span>
                    <span className="block text-xs text-foreground/80">{a.reasons.join(" · ")}</span>
                    <span className={`block text-xs ${a.followUpPending ? "text-amber-500" : "text-muted-foreground"}`}>{followUpText(a)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {alerts.length > COLLAPSED && (
        <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs font-semibold text-primary">
          {showAll ? "Ver menos" : `Ver las ${alerts.length} alertas`}
        </button>
      )}
    </section>
  );
}
