import { Link } from "@tanstack/react-router";
import { Brain, ChevronRight, Heart, Shield, Zap } from "lucide-react";
import type { CheckinRecord, WellbeingPrediction } from "@/lib/wellbeing/types";
import { RISK_COPY, DISCLAIMER } from "@/lib/wellbeing/copy";
import { TREND_COPY } from "@/lib/wellbeing/trend";
import { getMissionById, primaryStatOf } from "@/lib/missionsData";
import { deriveUserMetrics, type MetricKey } from "@/lib/wellbeing/metrics";

const STATS: { key: MetricKey; label: string; icon: typeof Heart }[] = [
  { key: "bienestar", label: "Bienestar", icon: Heart },
  { key: "resiliencia", label: "Resiliencia", icon: Shield },
  { key: "energia", label: "Energía", icon: Zap },
  { key: "claridad", label: "Claridad", icon: Brain },
];

interface Props {
  missionHistory: { id: string; title: string; date: string; xp: number }[];
  checkins: CheckinRecord[];
  streak: number;
  dailyGoal: number;
  isLoading: boolean;
  consentAccepted: boolean;
  todayCheckin: CheckinRecord | null;
  prediction: WellbeingPrediction | null;
}

export function IntegratedStatus({
  missionHistory,
  checkins,
  streak,
  dailyGoal,
  isLoading,
  consentAccepted,
  todayCheckin,
  prediction,
}: Props) {
  if (isLoading)
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-20 animate-pulse rounded-2xl bg-card" />
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      </div>
    );

  const level = prediction?.riskLevel ?? "insuficiente";
  const copy = RISK_COPY[level];
  const metrics = deriveUserMetrics({ missionHistory, checkins, streak, dailyGoal });

  return (
    <div className="space-y-3">
      {!consentAccepted ? (
        <Link to="/ai" className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Predicción de bienestar</p>
            <p className="text-xs text-muted-foreground">Activa el módulo preventivo</p>
          </div>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <Link to="/ai" className="block rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-semibold">{copy.title}</span>
            {typeof prediction?.score === "number" && (
              <span className="ml-auto font-bold">{Math.round(prediction.score * 100)}%</span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {todayCheckin
              ? "Check-in de hoy registrado"
              : "Aún no has hecho tu check-in de hoy · regístralo en Predicción de bienestar"}
          </p>
          {prediction && <p className="mt-2 text-[10px] text-muted-foreground">{TREND_COPY[prediction.trend].label}</p>}
          <p className="mt-2 text-[10px] text-muted-foreground">{DISCLAIMER}</p>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        {STATS.map(({ key, label, icon: Icon }) => {
          const m = metrics[key];
          return (
            <div key={key} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {label}
              </div>
              {m.value === null ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">Sin datos aún</p>
                  <Link to="/missions" className="mt-2 inline-block text-[10px] font-semibold text-primary">
                    Completa una misión →
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold">{m.value}%</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${m.value}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{m.source}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel font-semibold">Actividad reciente</h2>
          <Link to="/missions" className="text-xs text-primary">
            Ir a misiones →
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {missionHistory.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
              Todavía no has completado misiones. Tus métricas se activarán con tu primera tarea.
            </p>
          ) : (
            missionHistory.slice(0, 3).map((h, i) => {
              const stat = primaryStatOf(getMissionById(h.id));
              return (
                <div key={`${h.id}-${i}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <span aria-hidden="true">✅</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{h.title}</p>
                    <p className="text-[10px] text-muted-foreground">{h.date}</p>
                  </div>
                  {stat && <span className="text-[10px] text-muted-foreground">{stat}</span>}
                  <span className="text-[10px] font-bold text-soul-gold">+{h.xp} XP</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
