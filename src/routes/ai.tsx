import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Brain, RefreshCw } from "lucide-react";
import { useWellbeing } from "@/hooks/useWellbeing";
import { ConsentCard } from "@/components/wellbeing/ConsentCard";
import { CheckinCard } from "@/components/wellbeing/CheckinCard";
import { RiskCard } from "@/components/wellbeing/RiskCard";
import { TimelineFeed } from "@/components/wellbeing/TimelineFeed";
import { TREND_COPY } from "@/lib/wellbeing/trend";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Predicción de bienestar | SoulSync" },
      {
        name: "description",
        content:
          "Señal preventiva exploratoria de bienestar emocional a partir de tus check-ins y patrones de uso. No es un diagnóstico.",
      },
      { property: "og:title", content: "Predicción de bienestar | SoulSync" },
      {
        property: "og:description",
        content: "Insights preventivos explicables basados en tus check-ins diarios y tu actividad en SoulSync.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AIPage,
});

function AIPage() {
  const { data, isLoading, checkin, consent, refetch, isFetching } = useWellbeing();

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-cinzel font-bold text-foreground">Predicción de bienestar</h1>
            <p className="mt-1 text-sm text-muted-foreground">Señal preventiva, no un diagnóstico</p>
          </div>
          <button
            onClick={() => refetch()}
            aria-label="Recalcular señal preventiva"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="mt-6 space-y-3" aria-busy="true">
            <div className="h-28 animate-pulse rounded-2xl bg-card" />
            <div className="h-44 animate-pulse rounded-2xl bg-card" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <ConsentCard
              accepted={data.consent.accepted}
              acceptedAt={data.consent.acceptedAt}
              wearablesOptIn={data.consent.wearablesOptIn}
              pending={consent.isPending}
              onChange={(accepted, wearablesOptIn) => consent.mutate({ accepted, wearablesOptIn })}
            />

            {data.consent.accepted && (
              <>
                <CheckinCard
                  today={data.todayCheckin}
                  pending={checkin.isPending}
                  onSubmit={(v) => checkin.mutate(v)}
                />

                {data.prediction && data.prediction.riskLevel !== "insuficiente" && (
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <h2 className="font-cinzel font-semibold text-foreground">
                      {TREND_COPY[data.prediction.trend].label}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {TREND_COPY[data.prediction.trend].body}
                    </p>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-secondary/50 p-2">
                        <dt className="text-[10px] text-muted-foreground">Ventana</dt>
                        <dd className="text-xs font-semibold text-foreground">7 vs 7 días</dd>
                      </div>
                      <div className="rounded-xl bg-secondary/50 p-2">
                        <dt className="text-[10px] text-muted-foreground">Cambio</dt>
                        <dd className="text-xs font-semibold text-foreground">
                          {(data.prediction.trendDelta * 100).toFixed(0)} pts
                        </dd>
                      </div>
                      <div className="rounded-xl bg-secondary/50 p-2">
                        <dt className="text-[10px] text-muted-foreground">Tareas</dt>
                        <dd className="text-xs font-semibold text-foreground">
                          {data.world ? `${data.world.tasksToday}/${data.world.dailyGoal}` : "—"}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-[10px] text-muted-foreground">
                      Esta estimación es preventiva y no constituye un diagnóstico médico o psicológico.
                    </p>
                  </section>
                )}

                {data.prediction ? (
                  <RiskCard prediction={data.prediction} />
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">
                        Registra tu día unas veces más para generar tu primera señal.
                      </p>
                    </div>
                  </div>
                )}

                <section>
                  <h2 className="font-cinzel font-semibold text-foreground">Historia reciente</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tus tareas y check-ins coinciden en el tiempo con los cambios de señal.
                  </p>
                  <TimelineFeed entries={data.timeline} limit={5} className="mt-3" />
                  <Link to="/world" className="mt-2 inline-block text-xs font-semibold text-primary">
                    Ver timeline completo en Mi Mundo →
                  </Link>
                </section>

                <Link
                  to="/missions"
                  className="flex min-h-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/5 text-sm font-semibold text-primary transition-transform active:scale-[0.98]"
                >
                  Ir a misiones de autocuidado →
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
