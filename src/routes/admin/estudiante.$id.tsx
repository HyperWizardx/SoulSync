import { AlertTriangle } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/presentation/components/admin/AdminShell";
import { useState } from "react";
import { toast } from "sonner";
import { useAddFollowUp, useAdminAccess, useStudentDetail } from "@/presentation/hooks/useAdmin";
import { CategoryChart, ChartCard, MoodStressChart, ScoreHistoryChart, SleepChart } from "@/presentation/components/admin/DashboardCharts";
import { PRIORITY_STYLE, followUpText } from "@/presentation/components/admin/AlertsPanel";
import { alertFor, FOLLOW_UP_WINDOW_DAYS } from "@/domain/research/alerts";
import { displayTimelineTitle } from "@/domain/wellbeing/copy";
import { MissionResponses } from "@/presentation/components/admin/MissionResponses";
import type { StudentRow } from "@/service/server-functions/admin.functions";

export const Route = createFileRoute("/admin/estudiante/$id")({
  component: StudentDetailPage,
  head: () => ({
    meta: [
      { title: "Ficha del estudiante | SoulSync" },
      { name: "description", content: "Ficha individual con check-ins, adherencia a misiones, historial y factores explicativos de la señal preventiva." },
      { property: "og:title", content: "Ficha del estudiante | SoulSync" },
      { property: "og:description", content: "Seguimiento individual del bienestar dentro del panel de administración de SoulSync." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const RISK_CLASS: Record<string, string> = {
  alto: "bg-destructive/15 text-destructive",
  moderado: "bg-amber-500/15 text-amber-500",
  bajo: "bg-emerald-500/15 text-emerald-500",
  insuficiente: "bg-muted text-muted-foreground",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function CheckinChart({ checkins }: { checkins: { date: string; mood: number; stress: number; energy: number; social: number }[] }) {
  if (checkins.length === 0) return <p className="text-sm text-muted-foreground">Sin check-ins en los últimos 30 días.</p>;
  const series = [
    { key: "mood" as const, label: "Ánimo", color: "bg-emerald-500" },
    { key: "stress" as const, label: "Estrés", color: "bg-destructive" },
    { key: "energy" as const, label: "Energía", color: "bg-amber-500" },
    { key: "social" as const, label: "Social", color: "bg-primary" },
  ];
  return (
    <div className="space-y-4">
      {series.map((s) => (
        <div key={s.key}>
          <p className="mb-1 text-xs text-muted-foreground">{s.label}</p>
          <div className="flex h-16 items-end gap-1">
            {checkins.map((c) => (
              <div
                key={`${s.key}-${c.date}`}
                title={`${c.date}: ${c[s.key]}/5`}
                className={`flex-1 rounded-t ${s.color}`}
                style={{ height: `${(c[s.key] / 5) * 100}%` }}
              />
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        {checkins[0]?.date} → {checkins[checkins.length - 1]?.date}
      </p>
    </div>
  );
}

function FollowUpSection({ studentId, items }: { studentId: string; items: { id: string; note: string; createdAt: string }[] }) {
  const add = useAddFollowUp(studentId);
  const [note, setNote] = useState("");
  return (
    <Section title="Seguimiento realizado">
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate(note, { onSuccess: () => { setNote(""); toast.success("Seguimiento registrado"); }, onError: () => toast.error("No se pudo registrar") });
        }}
      >
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Nota breve (opcional)" aria-label="Nota de seguimiento"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
        <button disabled={add.isPending} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Registrar</button>
      </form>
      {items.length === 0 ? <p className="text-xs text-muted-foreground">Sin seguimientos registrados.</p> : (
        <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
          {items.map((f) => (
            <li key={f.id} className="border-b border-border/40 py-1 last:border-0">
              <span className="text-muted-foreground">{new Date(f.createdAt).toLocaleString("es-CO")}</span>
              {f.note && <p className="text-foreground">{f.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Alerta vigente del estudiante (misma regla que la cola del panel). */
function StudentAlertBanner({ row }: { row: StudentRow }) {
  const now = new Date();
  const alert = alertFor(row, now);
  if (!alert) return null;
  const s = PRIORITY_STYLE[alert.priority];
  const days = row.lastFollowUp ? Math.floor((now.getTime() - Date.parse(row.lastFollowUp)) / 86_400_000) : null;
  const pending = days === null || days > FOLLOW_UP_WINDOW_DAYS[alert.priority];
  return (
    <div className={`rounded-2xl border border-border p-4 ${s.chip}`} role="status">
      <p className="flex items-center gap-2 text-sm font-semibold"><s.Icon className="h-4 w-4" aria-hidden /> Alerta: {s.label}</p>
      <p className="mt-1 text-xs text-foreground">{alert.reasons.join(" · ")}</p>
      <p className="mt-1 text-xs">{followUpText({ priority: alert.priority, daysSinceFollowUp: days, followUpPending: pending })}</p>
    </div>
  );
}

function StudentDetailPage() {
  const { id } = Route.useParams();
  const { data: access } = useAdminAccess();
  const { data, isLoading, error } = useStudentDetail(id, Boolean(access?.psicologo));

  return (
    <AdminShell
      title="Ficha del estudiante"
      subtitle="Rol psicología · seguimiento individual"
      requires="psicologo"
      back={{ to: "/admin", label: "Estudiantes" }}
    >
      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : error || !data ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No se pudo cargar la ficha de este estudiante.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title={data.row.name}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p className="text-muted-foreground">Correo<br /><span className="text-foreground">{data.row.email ?? "—"}</span></p>
              <p className="text-muted-foreground">Código<br /><span className="text-foreground">{data.row.participantCode}</span></p>
              <p className="text-muted-foreground">Nivel<br /><span className="text-foreground">{data.row.level}</span></p>
              <p className="text-muted-foreground">Racha<br /><span className="text-foreground">{data.row.streak} días</span></p>
              <p className="text-muted-foreground">Consentimiento<br /><span className="text-foreground capitalize">{data.row.consent}</span></p>
              <p className="text-muted-foreground">Última actividad<br /><span className="text-foreground">{data.row.lastActivity?.slice(0, 10) ?? "—"}</span></p>
            </div>
          </Section>

          <Section title="Señal preventiva">
            {data.row.consent !== "vigente" ? (
              <p className="text-sm text-muted-foreground">
                Sin consentimiento vigente: no se calculan señales ni se muestran datos de bienestar.
              </p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm capitalize ${RISK_CLASS[data.row.riskLevel ?? "insuficiente"]}`}>
                    {data.row.riskLevel}
                  </span>
                  <span className="text-xs capitalize text-muted-foreground">Tendencia: {data.row.trend}</span>
                  <span className="text-xs text-muted-foreground">Cobertura: {Math.round(data.row.coverage * 100)}%</span>
                  {data.row.score !== null ? <span className="text-xs text-muted-foreground">Score: {data.row.score.toFixed(2)}</span> : null}
                </div>
                {data.prediction && (
                  <div className="mb-3 space-y-1 rounded-xl bg-secondary/50 p-3 text-xs">
                    <p className="text-foreground">Confianza: <span className="capitalize">{data.prediction.confidence ?? "—"}</span></p>
                    {data.prediction.safetyFlags.length > 0 && <p className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-4 w-4" /> Revisión prioritaria: {data.prediction.safetyFlags.join(" · ")}</p>}
                    {data.prediction.protective.length > 0 && <p className="text-soul-teal">Protectores: {data.prediction.protective.join(" · ")}</p>}
                    {data.prediction.adjustments && (
                      <p className="text-muted-foreground">
                        Ajustes: personal {data.prediction.adjustments.personal.toFixed(2)} · protectores {data.prediction.adjustments.protective.toFixed(2)} · académico {data.prediction.adjustments.academic.toFixed(2)} · histéresis {data.prediction.adjustments.hysteresis}
                      </p>
                    )}
                  </div>
                )}
                {data.insufficientReason ? <p className="mb-2 text-xs text-muted-foreground">{data.insufficientReason}</p> : null}
                <ul className="space-y-2">
                  {data.explanation.map((f) => (
                    <li key={f.key} className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-foreground">{f.label}</span>
                        <span className={f.direction === "riesgo" ? "text-destructive" : "text-emerald-500"}>
                          {Math.round(f.contribution * 100)}%
                        </span>
                      </div>
                      <p className="text-muted-foreground">{f.description}</p>
                    </li>
                  ))}
                  {data.explanation.length === 0 ? <li className="text-xs text-muted-foreground">Aún no hay factores calculables.</li> : null}
                </ul>
              </>
            )}
          </Section>

          <StudentAlertBanner row={data.row} />
          <FollowUpSection studentId={id} items={data.followUps ?? []} />
          <MissionResponses items={data.responses ?? []} />

          <ChartCard title="Ánimo y estrés (30 días)">
            <MoodStressChart data={data.checkins} />
          </ChartCard>
          <ChartCard title="Sueño reportado">
            <SleepChart data={data.checkins.map((c) => ({ date: c.date, sleep: c.sleepHours ?? null }))} />
          </ChartCard>
          <ChartCard title="Evolución del índice preventivo">
            <ScoreHistoryChart data={[...data.predictions].reverse().map((p) => ({ date: p.generatedAt.slice(0, 10), score: p.score }))} />
          </ChartCard>
          <ChartCard title="Misiones completadas vs omitidas">
            <CategoryChart data={data.tasksByCategory} />
          </ChartCard>

          <Section title="Check-ins (30 días)">
            <CheckinChart checkins={data.checkins} />
          </Section>

          <Section title="Historial de predicciones">
            {data.predictions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin predicciones guardadas.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {data.predictions.map((p) => (
                  <li key={p.generatedAt} className="flex justify-between border-b border-border/40 py-1 last:border-0">
                    <span className="text-muted-foreground">{p.generatedAt.slice(0, 10)}</span>
                    <span className="capitalize text-foreground">{p.riskLevel} · {p.trend}</span>
                    <span className="text-muted-foreground">{p.score === null ? "—" : p.score.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Adherencia por categoría (30 días)">
            {data.tasksByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos de tareas registrados.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {data.tasksByCategory.map((c) => {
                  const total = c.completed + c.skipped;
                  return (
                    <li key={c.category}>
                      <div className="mb-1 flex justify-between">
                        <span className="capitalize text-foreground">{c.category}</span>
                        <span className="text-muted-foreground">{c.completed} hechas · {c.skipped} omitidas</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-emerald-500" style={{ width: `${total === 0 ? 0 : (c.completed / total) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Misiones recientes">
            {data.missions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin misiones completadas.</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto text-xs">
                {data.missions.map((m, i) => (
                  <li key={`${m.completedAt}-${i}`} className="flex justify-between border-b border-border/40 py-1 last:border-0">
                    <span className="text-foreground">{m.title}{m.isAr ? " · AR" : ""}</span>
                    <span className="text-muted-foreground">{m.completedAt.slice(0, 10)} · {m.xp} XP</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Historia unificada">
            {data.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                {data.timeline.map((t) => (
                  <li key={t.id}>
                    <p className="text-foreground">{displayTimelineTitle(t.title)}</p>
                    <p className="text-muted-foreground">{t.occurredAt.slice(0, 16).replace("T", " ")}{t.detail ? ` · ${t.detail}` : ""}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Estado del mundo, estadísticas y escalas">
            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                Mundo:{" "}
                {data.world
                  ? `vitalidad ${data.world.vitality} · armonía ${data.world.harmony} · ${data.world.zonesUnlocked} zonas · ${data.world.season}`
                  : "sin datos"}
              </p>
              <p className="text-muted-foreground">
                Estadísticas:{" "}
                {data.stats
                  ? `bienestar ${data.stats.bienestar} · resiliencia ${data.stats.resiliencia} · energía ${data.stats.energia} · claridad ${data.stats.claridad}`
                  : "sin datos"}
              </p>
              {data.attributes ? (
                <p className="text-muted-foreground">
                  Atributos:{" "}
                  {Object.entries(data.attributes)
                    .map(([k, v]) => `${k.replace("_", " ")} ${v}`)
                    .join(" · ")}
                </p>
              ) : null}
              <p className="text-muted-foreground">
                Escalas:{" "}
                {data.scales.length === 0
                  ? "sin respuestas"
                  : data.scales.map((s) => `${s.code} ${s.raw}/${s.max} (${s.answeredAt.slice(0, 10)})`).join(" · ")}
              </p>
            </div>
          </Section>
        </div>
      )}
    </AdminShell>
  );
}
