/** Panel de la pantalla IA: confianza, cambios desde la última señal, misiones sugeridas y gráfico de 14 días. */
import { Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck } from "lucide-react";
import type { CheckinRecord, RiskLevel, WellbeingPrediction } from "@/domain/wellbeing/types";
import { CONFIDENCE_COPY, SAFETY_FLAG_COPY } from "@/domain/wellbeing/decision";
import { suggestMissions } from "@/domain/wellbeing/recommendations";
import { MoodStressChart } from "@/presentation/components/admin/DashboardCharts";

const LEVEL_LABEL: Record<RiskLevel, string> = { bajo: "Bajo", moderado: "Moderado", alto: "Alto", insuficiente: "Sin datos" };

export function InsightPanel({ prediction, previous, checkins }: {
  prediction: WellbeingPrediction;
  previous?: { riskLevel: RiskLevel; score: number | null } | null;
  checkins: CheckinRecord[];
}) {
  const suggestions = suggestMissions(prediction.explanation);
  const cutoff = new Date(Date.now() - 13 * 86_400_000).toISOString().slice(0, 10);
  const series = [...checkins].filter((c) => c.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
  const delta = prediction.score !== null && previous?.score != null ? Math.round((prediction.score - previous.score) * 100) : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          {prediction.confidence && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${prediction.confidence === "baja" ? "bg-secondary text-muted-foreground" : "bg-primary/15 text-primary"}`}>
              {CONFIDENCE_COPY[prediction.confidence]}
            </span>
          )}
          {previous && (
            <span className="text-xs text-muted-foreground">
              Antes: {LEVEL_LABEL[previous.riskLevel]}
              {delta !== null && ` · ${delta > 0 ? "+" : ""}${delta} pts`}
            </span>
          )}
        </div>
        {prediction.confidence === "baja" && (
          <p className="mt-2 text-xs text-muted-foreground">Señal preliminar: registra tu día varias veces más para que sea más precisa.</p>
        )}
        {(prediction.safetyFlags ?? []).length > 0 && (
          <p className="mt-2 text-xs text-destructive">Notamos: {(prediction.safetyFlags ?? []).map((f) => SAFETY_FLAG_COPY[f]).join(" · ")}.</p>
        )}
        {(prediction.protectiveFactors ?? []).length > 0 && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-soul-teal">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Te está ayudando: {(prediction.protectiveFactors ?? []).map((f) => f.label.toLowerCase()).join(", ")}.
          </p>
        )}
        {series.length >= 2 && (
          <div className="mt-3 h-40">
            <MoodStressChart data={series} />
          </div>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <h2 className="flex items-center gap-2 font-cinzel font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Misiones para hoy
          </h2>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <li key={s.missionId}>
                <Link
                  to="/missions"
                  search={{ mission: s.missionId }}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 transition-transform active:scale-[0.98]"
                >
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{s.title}</span>
                    <span className="block text-xs text-muted-foreground">{s.reason}</span>
                  </span>
                  <span className="text-xs font-semibold text-primary">Empezar →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
