import { Link } from "@tanstack/react-router";
import { Brain, ChevronRight } from "lucide-react";
import { useWellbeing } from "@/hooks/useWellbeing";
import { RISK_COPY } from "@/lib/wellbeing/copy";

const TONE: Record<string, string> = {
  teal: "border-soul-teal/30 bg-soul-teal/5 text-soul-teal",
  gold: "border-soul-gold/30 bg-soul-gold/5 text-soul-gold",
  destructive: "border-destructive/40 bg-destructive/10 text-destructive",
  muted: "border-border bg-card text-muted-foreground",
};

/** Resumen compacto de la señal preventiva para el Dashboard. */
export function WellbeingPreview() {
  const { data, isLoading } = useWellbeing();

  if (isLoading) return <div className="h-16 animate-pulse rounded-xl bg-card" />;

  if (!data?.consent.accepted) {
    return (
      <Link
        to="/ai"
        className="flex min-h-11 items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 transition-all hover:border-primary/60 active:scale-[0.98]"
      >
        <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Predicción de bienestar</p>
          <p className="text-xs text-muted-foreground">Activa el módulo preventivo (requiere consentimiento)</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </Link>
    );
  }

  const level = data.prediction?.riskLevel ?? "insuficiente";
  const copy = RISK_COPY[level];
  const tone = TONE[copy.tone] ?? TONE.muted;
  const score = data.prediction?.score;

  return (
    <Link
      to="/ai"
      className={`flex min-h-11 items-center gap-3 rounded-xl border p-3 transition-all active:scale-[0.98] ${tone}`}
    >
      <Brain className="h-5 w-5" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        <p className="text-xs text-muted-foreground">
          {data.todayCheckin ? "Check-in de hoy listo" : "Aún no has hecho tu check-in de hoy"}
        </p>
      </div>
      {typeof score === "number" && <span className="text-sm font-bold">{Math.round(score * 100)}%</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
