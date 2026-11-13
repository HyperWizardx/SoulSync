import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileLayout } from "@/presentation/components/layout/MobileLayout";
import { Brain, RefreshCw } from "lucide-react";
import { useWellbeing } from "@/presentation/hooks/useWellbeing";
import { ConsentCard } from "@/presentation/components/wellbeing/ConsentCard";
import { CheckinCard } from "@/presentation/components/wellbeing/CheckinCard";
import { Who5Card } from "@/presentation/components/wellbeing/Who5Card";
import { SupportBanner, SupportButton } from "@/presentation/components/wellbeing/SupportSheet";
import { supportReasons } from "@/domain/wellbeing/support";
import { localToday } from "@/presentation/hooks/useActivity";
import { RiskCard } from "@/presentation/components/wellbeing/RiskCard";
import { InsightPanel } from "@/presentation/components/wellbeing/InsightPanel";
import { TimelineFeed } from "@/presentation/components/wellbeing/TimelineFeed";
import { ErrorState, LoadingState } from "@/presentation/components/common/QueryStatus";
import { TREND_COPY } from "@/domain/wellbeing/trend";
import { MoodForecastCard } from "@/presentation/components/wellbeing/MoodForecastCard";
import { ParticipantProfileCard } from "@/presentation/components/wellbeing/ParticipantProfileCard";
import { WhatIfCard } from "@/presentation/components/wellbeing/WhatIfCard";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Brújula de bienestar | SoulSync" },
      {
        name: "description",
        content:
          "Tu brújula de bienestar en SoulSync: un check-in diario, misiones para hoy y consejos para tu viaje. Orientativa, no es un diagnóstico.",
      },
      { property: "og:title", content: "Brújula de bienestar | SoulSync" },
      {
        property: "og:description",
        content: "Un check-in diario, misiones para hoy y consejos para tu viaje en SoulSync.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AIPage,
});

function AIPage() {
  const { data, isLoading, isError, error, checkin, consent, refetch, isFetching, who5, writingShare } = useWellbeing();
  const consentCard = data && (
    <ConsentCard
      accepted={data.consent.accepted}
      acceptedAt={data.consent.acceptedAt}
      wearablesOptIn={data.consent.wearablesOptIn}
      shareWriting={data.consent.shareWriting}
      onShareWritingChange={(share) => writingShare.mutate(share)}
      sharePending={writingShare.isPending}
      pending={consent.isPending}
      onChange={(accepted, wearablesOptIn, shareWriting) => consent.mutate({ accepted, wearablesOptIn, shareWriting })}
      outdated={!data.consent.accepted && !!data.consent.consentVersion && data.consent.consentVersion !== data.consent.currentVersion}
    />
  );

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-cinzel font-bold text-foreground">Brújula de bienestar</h1>
            <p className="mt-1 text-sm text-muted-foreground">Escucha cómo va tu viaje interior</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
          <SupportButton />
          <button
            onClick={() => refetch()}
            aria-label="Actualizar tu brújula"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
          </div>
        </div>

        {isError && !data ? (
          <div className="mt-6">
            <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} retrying={isFetching} />
          </div>
        ) : isLoading || !data ? (
          <div className="mt-6">
            <LoadingState onRetry={() => refetch()}>
              <div className="h-28 animate-pulse rounded-2xl bg-card" />
              <div className="h-44 animate-pulse rounded-2xl bg-card" />
            </LoadingState>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Sin consentimiento, lo primero es aceptarlo; con él, el check-in diario va arriba y el consentimiento al final. */}
            {!data.consent.accepted && consentCard}

            {data.consent.accepted && (
              <>
                <CheckinCard
                  today={data.todayCheckin}
                  pending={checkin.isPending}
                  onSubmit={(v) => checkin.mutate(v)}
                />

                {/* Protocolo de apoyo: aviso cuando la brújula o el pergamino lo sugieren */}
                {supportReasons({ riskLevel: data.prediction?.riskLevel, safetyFlags: data.prediction?.safetyFlags, lastScale: data.lastScale }).length > 0 && <SupportBanner />}

                {/* Pergamino del bienestar (WHO-5), cada 14 días */}
                <Who5Card lastScale={data.lastScale} today={localToday()} pending={who5.isPending} onSubmit={(a) => who5.mutate(a)} />

                {/* La brújula primero: es lo que el usuario viene a ver */}
                {data.prediction ? (
                  <RiskCard prediction={data.prediction} />
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">
                        Registra tu día un par de veces más y tu brújula empezará a orientarte.
                      </p>
                    </div>
                  </div>
                )}

                {data.prediction && data.prediction.riskLevel !== "insuficiente" && (
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Rumbo de tu semana</p>
                    <h2 className="mt-1 font-cinzel font-semibold text-foreground">
                      {TREND_COPY[data.prediction.trend].label}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {TREND_COPY[data.prediction.trend].body}
                    </p>
                    {data.world && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Hoy llevas <span className="font-semibold text-foreground">{data.world.tasksToday} de {data.world.dailyGoal}</span> misiones de tu meta diaria.
                      </p>
                    )}
                  </section>
                )}

                {/* ¿Y si…?: el estudiante prueba hábitos y ve cómo cambiaría su brújula (mismo modelo, no se guarda) */}
                {data.prediction && data.prediction.riskLevel !== "insuficiente" && (
                  <WhatIfCard prediction={data.prediction} params={data.compassParams ?? null} checkinCount={Math.min(14, data.checkins.length)} />
                )}

                {/* Pronóstico propio (Holt): anticipa una posible bajada para prepararse a tiempo */}
                {data.forecast && <MoodForecastCard forecast={data.forecast} checkins={data.checkins} />}

                {data.prediction && data.prediction.riskLevel !== "insuficiente" && (
                  <InsightPanel prediction={data.prediction} previous={data.previous} checkins={data.checkins} />
                )}

                <section>
                  <h2 className="font-cinzel font-semibold text-foreground">Tus últimas huellas</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lo que has vivido estos días en tu aventura.
                  </p>
                  <TimelineFeed entries={data.timeline} limit={5} className="mt-3" />
                  <Link to="/world" className="mt-2 inline-block text-xs font-semibold text-primary">
                    Ver toda tu crónica en Mi Mundo →
                  </Link>
                </section>

                <Link
                  to="/missions"
                  className="flex min-h-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/5 text-sm font-semibold text-primary transition-transform active:scale-[0.98]"
                >
                  Elegir una misión de autocuidado →
                </Link>

                <ParticipantProfileCard />

                {consentCard}
              </>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
