import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminAccess, useExportDataset, usePopulationMetrics } from "@/hooks/useAdmin";
import { DATASETS, type DatasetKey } from "@/lib/admin.functions";

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

function AdminMetricsPage() {
  const { data: access } = useAdminAccess();
  const { data, isLoading } = usePopulationMetrics(Boolean(access?.investigador));
  const exportCsv = useExportDataset();
  const [busy, setBusy] = useState<DatasetKey | null>(null);

  const m = data?.metrics;

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
      {isLoading || !m ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
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
