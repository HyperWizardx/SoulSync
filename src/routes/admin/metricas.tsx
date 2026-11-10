import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { WhatIfSimulator } from "@/presentation/components/admin/WhatIfSimulator";
import { ModelsPanel } from "@/presentation/components/admin/ModelsPanel";
import { CompassLab } from "@/presentation/components/admin/CompassLab";
import { ProfilesPanel } from "@/presentation/components/admin/ProfilesPanel";
import { useModelLab } from "@/presentation/hooks/useAdmin";
import { AdminShell } from "@/presentation/components/admin/AdminShell";
import { useAdminAccess, useCalendarActions, useExportDataset, usePopulationMetrics } from "@/presentation/hooks/useAdmin";
import { ActivityChart, CategoryChart, ChartCard, DonutChart, HorizontalBars, MoodStressChart, RiskHistoryChart, StatTile } from "@/presentation/components/admin/DashboardCharts";
import { ErrorState, LoadingState } from "@/presentation/components/common/QueryStatus";
import { DATASETS, type DatasetKey } from "@/service/server-functions/admin.functions";

export const Route = createFileRoute("/admin/metricas")({
  component: AdminMetricsPage,
  head: () => ({
    meta: [
      { title: "Métricas de la población | SoulSync" },
      { name: "description", content: "Métricas agregadas y seudonimizadas de la población piloto: distribución de riesgo, adherencia y cobertura de datos." },
      { property: "og:title", content: "Métricas de la población | SoulSync" },
      { property: "og:description", content: "Panel de investigación con métricas agregadas y exportación de datos para la tesis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const DATASET_LABEL: Record<DatasetKey, string> = {
  resumen: "Resumen por participante",
  checkins: "Check-ins diarios",
  task_events: "Eventos de tareas",
  missions: "Misiones completadas",
  predictions: "Predicciones del modelo",
  scales: "Escalas psicométricas",
};

const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

function Bar({ label, value, total, className }: { label: string; value: number; total: number; className: string }) {
  const width = total === 0 ? 0 : (value / total) * 100;
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span className="capitalize">{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function CalendarManager({ periods }: { periods: { id: string; label: string; start: string; end: string }[] }) {
  const { add, remove } = useCalendarActions();
  const [label, setLabel] = useState("Parciales");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-4">
      <h2 className="font-semibold text-foreground">Calendario académico</h2>
      <p className="mb-3 text-xs text-muted-foreground">En estas fechas el modelo atenúa el estrés situacional (p. ej. semana de parciales).</p>
      <form
        className="mb-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!start || !end) return;
          add.mutate({ label, start, end }, { onSuccess: () => toast.success("Periodo guardado"), onError: (err) => toast.error(err.message) });
        }}
      >
        <input value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Nombre del periodo" className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Inicio" className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Fin" className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
        <button disabled={add.isPending} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Agregar</button>
      </form>
      {periods.length === 0 ? <p className="text-xs text-muted-foreground">Sin periodos registrados.</p> : (
        <ul className="space-y-1">
          {periods.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-sm">
              <span className="text-foreground">{p.label} · {p.start} → {p.end}</span>
              <button onClick={() => remove.mutate(p.id)} className="text-xs text-destructive">Eliminar</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AdminMetricsPage() {
  const { data: access } = useAdminAccess();
  const { data, isLoading, isError, error, refetch, isFetching } = usePopulationMetrics(Boolean(access?.investigador));
  const exportCsv = useExportDataset();
  const [busy, setBusy] = useState<DatasetKey | null>(null);

  const m = data?.metrics;
  const lab = useModelLab(!!access?.investigador);

  const download = async (dataset: DatasetKey) => {
    setBusy(dataset);
    try {
      const res = await exportCsv(dataset);
      toast.success(res.rows === 0 ? "No hay filas con consentimiento vigente" : `${res.rows} filas exportadas`);
    } catch {
      toast.error("No se pudo generar la exportación");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminShell title="Métricas de la población" subtitle="Rol investigación · datos agregados y seudonimizados" requires="investigador">
      {isError ? (
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} retrying={isFetching} />
      ) : isLoading || !m ? (
        <LoadingState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Participantes", value: String(m.total) },
              { label: "Con consentimiento", value: String(m.withConsent) },
              { label: "Con señal calculable", value: String(m.withSignal) },
              { label: "Activos hoy", value: String(m.activeToday) },
              { label: "Adherencia media 7d", value: pct(m.avgAdherence7) },
              { label: "Cobertura media", value: pct(m.avgCoverage) },
              { label: "Check-ins medios 14d", value: m.avgCheckins14 === null ? "—" : m.avgCheckins14.toFixed(1) },
              { label: "Tasa de omisión", value: pct(m.skipRate) },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 font-semibold text-foreground">Distribución de riesgo</h2>
              <Bar label="alto" value={m.riskDistribution.alto} total={m.total} className="bg-destructive" />
              <Bar label="moderado" value={m.riskDistribution.moderado} total={m.total} className="bg-amber-500" />
              <Bar label="bajo" value={m.riskDistribution.bajo} total={m.total} className="bg-emerald-500" />
              <Bar label="datos insuficientes" value={m.riskDistribution.insuficiente} total={m.total} className="bg-muted-foreground" />
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 font-semibold text-foreground">Tendencia del grupo</h2>
              <Bar label="mejorando" value={m.trendDistribution.mejorando} total={m.total} className="bg-emerald-500" />
              <Bar label="estable" value={m.trendDistribution.estable} total={m.total} className="bg-primary" />
              <Bar label="empeorando" value={m.trendDistribution.empeorando} total={m.total} className="bg-destructive" />
              <Bar label="indeterminada" value={m.trendDistribution.indeterminada} total={m.total} className="bg-muted-foreground" />
            </div>
          </div>

          <div className="mb-5 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  {["Participante", "Riesgo", "Score", "Tendencia", "Cobertura", "Check-ins 14d", "Misiones 7d", "Omitidas 7d"].map((h) => (
                    <th key={h} className="px-3 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.rows ?? []).map((r) => (
                  <tr key={r.userId} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 text-foreground">{r.participantCode}</td>
                    <td className="px-3 py-2 capitalize text-muted-foreground">{r.riskLevel ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.score === null ? "—" : r.score.toFixed(2)}</td>
                    <td className="px-3 py-2 capitalize text-muted-foreground">{r.trend ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{pct(r.coverage)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.checkins14}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.missions7}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.skipped7}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data?.dashboard && (
            <div className="mb-5 grid gap-3 lg:grid-cols-2">
              <ChartCard title="Actividad diaria del piloto" hint="Check-ins y misiones completadas, 14 días.">
                <ActivityChart data={data.dashboard.daily} />
              </ChartCard>
              <ChartCard title="Ánimo y estrés promedio" hint="Escala 1–5, participantes con consentimiento.">
                <MoodStressChart data={data.dashboard.daily} />
              </ChartCard>
              <ChartCard title="Uso por categoría de misión" hint="Eventos completados vs omitidos.">
                <CategoryChart data={data.dashboard.categories} />
              </ChartCard>
              <ChartCard title={`Confianza de las señales · ${data.modelVersion}`} hint="Según cantidad de check-ins y cobertura.">
                <DonutChart data={[
                  { name: "Alta", value: data.dashboard.confidence.alta, tone: "teal" },
                  { name: "Media", value: data.dashboard.confidence.media, tone: "gold" },
                  { name: "Preliminar", value: data.dashboard.confidence.baja, tone: "muted" },
                ]} />
              </ChartCard>
              <ChartCard title="Evolución de señales" hint="Predicciones por nivel y día.">
                <RiskHistoryChart data={data.dashboard.riskHistory} />
              </ChartCard>
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="font-semibold text-foreground">Relación misiones ↔ ánimo</h2>
                <p className="mb-3 text-xs text-muted-foreground">Ánimo promedio de la misma persona en días con y sin misiones (exploratorio, no causal).</p>
                <div className="grid grid-cols-2 gap-3">
                  <StatTile label="Días con misiones" value={data.dashboard.missionMood.withMissions ?? "—"} tone="ok" />
                  <StatTile label="Días sin misiones" value={data.dashboard.missionMood.withoutMissions ?? "—"} />
                </div>
                <div className="mt-3 h-32"><HorizontalBars data={data.dashboard.topFactors} /></div>
              </section>
            </div>
          )}

          <ModelsPanel enabled={!!access?.isAdmin} />

          <CompassLab enabled={!!access?.investigador} />

          <ProfilesPanel profiles={data?.profiles} />

          <CalendarManager periods={data?.calendar ?? []} />

          <WhatIfSimulator participants={data?.rows ?? []} activeParams={lab.data?.activeParams ?? null} />

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-1 font-semibold text-foreground">Exportar datos</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Solo participantes con consentimiento vigente. Sin nombres, correos ni texto libre.
            </p>
            <div className="flex flex-wrap gap-2">
              {DATASETS.map((d) => (
                <button
                  key={d}
                  onClick={() => download(d)}
                  disabled={busy !== null}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:border-primary disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {DATASET_LABEL[d]}
                  {busy === d ? " …" : ""}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
