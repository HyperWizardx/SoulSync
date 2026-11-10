// Laboratorio de la brújula (rol investigación): entrena con etiquetas WHO-5, compara con el
// criterio experto en validación cruzada, muestra los pesos aprendidos y la auditoría de equidad,
// y permite activar el modelo solo si supera la compuerta (o volver al experto). También evalúa
// el pronóstico de ánimo.
import { useState } from "react";
import { CheckCircle2, FlaskConical, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { StatTile } from "@/presentation/components/admin/DashboardCharts";
import { useCompassActions, useModelLab } from "@/presentation/hooks/useAdmin";
import type { CompassReport, ModelLab } from "@/service/server-functions/admin.functions";

const METRICS: { key: keyof NonNullable<CompassReport["cv"]>["expert"]; label: string; better: "alto" | "bajo" }[] = [
  { key: "auc", label: "AUC (discriminación)", better: "alto" },
  { key: "logLoss", label: "Log-loss", better: "bajo" },
  { key: "brier", label: "Brier", better: "bajo" },
  { key: "ece", label: "Error de calibración", better: "bajo" },
  { key: "sensitivity", label: "Sensibilidad (umbral moderado)", better: "alto" },
  { key: "specificity", label: "Especificidad", better: "alto" },
];
const num = (v: number | null | undefined, d = 3) => (v === null || v === undefined ? "—" : v.toFixed(d));
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`);

function ReportView({ report, lab, onActivate, busy }: { report: CompassReport; lab: ModelLab; onActivate: (v: string) => void; busy: boolean }) {
  const maxW = Math.max(0.01, ...report.weights.flatMap((w) => [Math.abs(w.expert), Math.abs(w.trained ?? 0)]));
  const isActive = report.version !== null && lab.active === report.version;
  return (
    <div className="mt-4 space-y-4">
      <div className={`rounded-xl p-3 text-sm ${report.gate.ready ? "bg-soul-teal/10 text-soul-teal" : "bg-secondary/60 text-foreground"}`}>
        <p className="flex items-center gap-2 font-semibold">
          {report.gate.ready ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XCircle className="h-4 w-4 text-soul-gold" aria-hidden />}
          {report.gate.ready ? "Lista para activar: mejora al criterio experto y supera la auditoría de equidad" : "Todavía no se puede activar"}
        </p>
        {report.gate.reasons.length > 0 && (
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">{report.gate.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {report.version ? `Versión ${report.version}` : "Sin versión registrada"} · {report.n} pergaminos · {report.students} estudiantes · {report.positives} con bienestar bajo
          {report.lambda !== null ? ` · λ = ${report.lambda}` : ""}
        </p>
        {report.gate.ready && report.version && !isActive && (
          <button onClick={() => onActivate(report.version!)} disabled={busy} className="mt-2 min-h-10 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
            Activar esta brújula para todos
          </button>
        )}
        {isActive && <p className="mt-2 text-xs font-semibold text-soul-teal">Es la brújula activa.</p>}
      </div>

      {report.cv && (
        <div className="overflow-x-auto">
          <h3 className="mb-1 text-sm font-semibold text-foreground">Validación cruzada por estudiante</h3>
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead className="text-muted-foreground"><tr><th className="py-1 pr-3 font-medium">Métrica</th><th className="py-1 pr-3 font-medium">Criterio experto</th><th className="py-1 font-medium">Brújula entrenada</th></tr></thead>
            <tbody>
              {METRICS.map((m) => {
                const e = report.cv!.expert[m.key] as number | null;
                const t = report.cv!.trained[m.key] as number | null;
                const wins = e !== null && t !== null && (m.better === "alto" ? t > e : t < e);
                return (
                  <tr key={m.key} className="border-t border-border">
                    <td className="py-1.5 pr-3 text-foreground">{m.label} <span className="text-muted-foreground">({m.better === "alto" ? "más es mejor" : "menos es mejor"})</span></td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{num(e)}</td>
                    <td className={`py-1.5 ${wins ? "font-semibold text-soul-teal" : "text-foreground"}`}>{num(t)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="mb-1 text-sm font-semibold text-foreground">Pesos por factor (escala logit)</h3>
        <p className="mb-2 text-xs text-muted-foreground">Gris: criterio experto · color: aprendido. Un peso negativo indica un factor que protege.</p>
        <ul className="space-y-1.5">
          {report.weights.map((w) => (
            <li key={w.key} className="text-xs">
              <div className="flex justify-between text-muted-foreground"><span className="text-foreground">{w.label}</span><span>{num(w.expert, 2)} → {num(w.trained, 2)}</span></div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${(Math.abs(w.expert) / maxW) * 100}%` }} /></div>
              {w.trained !== null && (
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${w.trained >= 0 ? "bg-primary" : "bg-soul-teal"}`} style={{ width: `${(Math.abs(w.trained) / maxW) * 100}%` }} /></div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {report.equity && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-foreground">Auditoría de equidad (principio OMS de inclusión)</h3>
          <p className="mb-2 text-xs text-muted-foreground">Por subgrupo con al menos 10 pergaminos: prevalencia real, probabilidad media del modelo y casos de bienestar bajo que no detecta (FNR).</p>
          <div className="space-y-2">
            {report.equity.trained.attributes.map((a) => (
              <div key={a.key} className="rounded-xl border border-border p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{a.label}</span>
                  {!a.evaluable ? <span className="text-muted-foreground">Sin datos suficientes</span>
                    : a.passed ? <span className="text-soul-teal">Sin diferencias relevantes</span>
                    : <span className="text-destructive">Diferencias entre grupos</span>}
                </div>
                {a.groups.length > 0 && (
                  <table className="mt-1 w-full text-left text-[11px]">
                    <thead className="text-muted-foreground"><tr><th className="pr-2 font-medium">Grupo</th><th className="pr-2 font-medium">n</th><th className="pr-2 font-medium">Prevalencia</th><th className="pr-2 font-medium">Media modelo</th><th className="font-medium">FNR</th></tr></thead>
                    <tbody>
                      {a.groups.map((g) => (
                        <tr key={g.value} className="text-foreground"><td className="pr-2">{g.label}</td><td className="pr-2">{g.n}</td><td className="pr-2">{pct(g.prevalence)}</td><td className="pr-2">{pct(g.meanPred)}</td><td>{pct(g.fnr)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompassLab({ enabled }: { enabled: boolean }) {
  const { data: lab, isLoading } = useModelLab(enabled);
  const { train, activate } = useCompassActions();
  const [fresh, setFresh] = useState<CompassReport | null>(null);
  if (!enabled) return null;
  const latest = fresh ?? lab?.versions.find((v) => v.report)?.report ?? null;

  const doActivate = (version: string) =>
    activate.mutate(version, {
      onSuccess: () => toast.success(version === "decision-v4" ? "Volviste al criterio experto." : "La brújula entrenada ya está activa."),
      onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo activar."),
    });

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-4" aria-labelledby="lab-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="lab-title" className="flex items-center gap-2 font-semibold text-foreground"><FlaskConical className="h-4 w-4 text-primary" aria-hidden /> Laboratorio de la brújula</h2>
        {lab && <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-foreground">Activa: {lab.active}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        Regresión logística propia que parte de los pesos expertos (estimación MAP) y aprende de los pergaminos WHO-5
        (bienestar bajo = puntaje menor a 13). Se valida con estudiantes que no participaron en el entrenamiento.
      </p>

      {isLoading || !lab ? (
        <div className="mt-3 h-28 animate-pulse rounded-xl bg-secondary/40" />
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Pergaminos utilizables" value={lab.dataset.samples} />
            <StatTile label="Con bienestar bajo" value={lab.dataset.positives} tone="warn" />
            <StatTile label="Estudiantes" value={lab.dataset.students} />
            <StatTile label="Con ficha opcional" value={lab.dataset.withProfile} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => train.mutate(undefined, { onSuccess: (r) => { setFresh(r); toast.success(r.version ? "Brújula entrenada y registrada (inactiva)." : "No hay datos suficientes para entrenar."); }, onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo entrenar.") })}
              disabled={train.isPending}
              className="min-h-10 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {train.isPending ? "Entrenando…" : "Entrenar con los datos actuales"}
            </button>
            {lab.active !== "decision-v4" && (
              <button onClick={() => doActivate("decision-v4")} disabled={activate.isPending} className="flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm text-foreground disabled:opacity-50">
                <RotateCcw className="h-4 w-4" aria-hidden /> Volver al criterio experto
              </button>
            )}
          </div>

          {latest && <ReportView report={latest} lab={lab} onActivate={doActivate} busy={activate.isPending} />}

          {lab.versions.length > 1 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">Versiones registradas ({lab.versions.length})</summary>
              <ul className="mt-2 space-y-1 text-xs">
                {lab.versions.map((v) => (
                  <li key={v.version} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-1.5">
                    <span className="font-mono text-foreground">{v.version}</span>
                    <span className="text-muted-foreground">{new Date(v.createdAt).toLocaleDateString("es-CO")}{v.report ? ` · AUC ${num(v.report.cv?.trained.auc, 2)}` : ""}</span>
                    {v.active ? <span className="text-soul-teal">Activa</span>
                      : (v.version === "decision-v4" || v.report?.gate.ready) ? (
                        <button onClick={() => doActivate(v.version)} disabled={activate.isPending} className="min-h-8 rounded-lg border border-border px-2 text-foreground">Activar</button>
                      ) : <span className="text-muted-foreground">No apta</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">Pronóstico de ánimo (Holt propio)</h3>
            <p className="text-xs text-muted-foreground">Evaluación con origen móvil: cada registro se pronostica con los anteriores (últimos 90 días).</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[360px] text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr><th className="py-1 pr-3 font-medium">Método</th><th className="py-1 pr-3 font-medium">MAE 1 paso</th><th className="py-1 pr-3 font-medium">RMSE 1 paso</th><th className="py-1 pr-3 font-medium">MAE 3 pasos</th><th className="py-1 font-medium">RMSE 3 pasos</th></tr>
                </thead>
                <tbody>
                  {([["holt", "Holt amortiguado (propio)"], ["naive", "Repetir el último registro"], ["mean7", "Media de los últimos 7"]] as const).map(([k, label]) => (
                    <tr key={k} className={`border-t border-border ${k === "holt" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      <td className="py-1.5 pr-3">{label}</td>
                      <td className="py-1.5 pr-3">{num(lab.forecast.h1[k].mae, 2)}</td>
                      <td className="py-1.5 pr-3">{num(lab.forecast.h1[k].rmse, 2)}</td>
                      <td className="py-1.5 pr-3">{num(lab.forecast.h3[k].mae, 2)}</td>
                      <td className="py-1.5">{num(lab.forecast.h3[k].rmse, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Error en la escala de ánimo 1–5 · {lab.forecast.students} estudiantes · {lab.forecast.predictions} pronósticos. El aviso de bajada usa el horizonte de 3 registros.</p>
          </div>
        </>
      )}
    </section>
  );
}
