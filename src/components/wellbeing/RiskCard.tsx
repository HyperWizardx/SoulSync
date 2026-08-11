import { AlertTriangle, LifeBuoy, TrendingUp } from "lucide-react";
import type { WellbeingPrediction } from "@/lib/wellbeing/types";
import { DISCLAIMER, MODEL_NOTE, RECOMMENDATIONS, RISK_COPY, SAFETY_MESSAGE } from "@/lib/wellbeing/copy";

const TONE: Record<string, { border: string; bg: string; text: string }> = {
  teal: { border: "border-soul-teal/40", bg: "bg-soul-teal/5", text: "text-soul-teal" },
  gold: { border: "border-soul-gold/40", bg: "bg-soul-gold/5", text: "text-soul-gold" },
  destructive: { border: "border-destructive/40", bg: "bg-destructive/5", text: "text-destructive" },
  muted: { border: "border-border", bg: "bg-card", text: "text-muted-foreground" },
};

export function RiskCard({ prediction }: { prediction: WellbeingPrediction }) {
  const copy = RISK_COPY[prediction.riskLevel];
  const tone = TONE[copy.tone] ?? TONE.muted;
  const topFactors = prediction.explanation.filter((f) => f.value > 0).slice(0, 4);

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border ${tone.border} ${tone.bg} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`font-cinzel font-bold ${tone.text}`}>{copy.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.body}</p>
          </div>
          {prediction.score !== null && (
            <div className="shrink-0 text-right">
              <p className={`text-2xl font-bold ${tone.text}`}>{Math.round(prediction.score * 100)}%</p>
              <p className="text-[10px] text-muted-foreground">índice exploratorio</p>
            </div>
          )}
        </div>

        {prediction.insufficientReason && (
          <p className="mt-2 text-[11px] text-muted-foreground">{prediction.insufficientReason}</p>
        )}

        {prediction.score !== null && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                prediction.riskLevel === "alto"
                  ? "bg-destructive"
                  : prediction.riskLevel === "moderado"
                    ? "bg-soul-gold"
                    : "bg-soul-teal"
              }`}
              style={{ width: `${Math.round(prediction.score * 100)}%` }}
            />
          </div>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
      </div>

      {prediction.riskLevel === "alto" && (
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-2">
            <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">Busca acompañamiento</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{SAFETY_MESSAGE}</p>
            </div>
          </div>
        </div>
      )}

      {topFactors.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="font-cinzel font-semibold text-foreground">Factores que más influyen</h3>
          </div>
          <div className="mt-3 space-y-3">
            {topFactors.map((f) => (
              <div key={f.key}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{f.label}</p>
                  <span className="text-[10px] text-muted-foreground">{Math.round(f.contribution * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${f.direction === "riesgo" ? "bg-soul-gold" : "bg-soul-teal"}`}
                    style={{ width: `${Math.round(f.contribution * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {topFactors.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <h3 className="font-cinzel font-semibold text-foreground">Autocuidado sugerido</h3>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Sugerencias no clínicas basadas en tus propios registros.
          </p>
          <ul className="mt-3 space-y-2">
            {topFactors.slice(0, 3).map((f) => (
              <li key={f.key} className="flex gap-2 text-xs text-muted-foreground">
                <span aria-hidden="true">✨</span>
                <span>{RECOMMENDATIONS[f.key]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/60 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="text-[10px] leading-relaxed text-muted-foreground">
            <p>{MODEL_NOTE}</p>
            <p className="mt-1 font-mono">
              model={prediction.modelVersion} · features={prediction.featureVersion} · cobertura=
              {Math.round(prediction.coverage * 100)}% ·{" "}
              {new Date(prediction.generatedAt).toLocaleString("es-CO")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
