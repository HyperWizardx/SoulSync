import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Brain, AlertTriangle, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useUserStore } from "@/hooks/useUserStore";
import { predictWellbeing, predictionCopy } from "@/lib/wellbeing";

export const Route = createFileRoute("/ai")({ component: AIPage });

function AIPage() {
  const { user } = useUserStore();
  const prediction = useMemo(() => predictWellbeing({
    bienestar: user.stats.bienestar,
    resiliencia: user.stats.resiliencia,
    energia: user.stats.energia,
    claridad: user.stats.claridad,
    conexionSocial: user.attributes.conexionSocial,
    streak: user.streak,
    dailyGoal: user.settings.dailyGoal,
    recentMissionCount: user.missionHistory.length,
    previousMissionCount: Math.max(1, user.missionHistory.length),
  }), [user]);
  const copy = predictionCopy(prediction);
  const percent = Math.round(prediction.score * 100);
  const high = prediction.riskLevel === "alto";
  const moderate = prediction.riskLevel === "moderado";

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <Brain className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-cinzel font-bold text-foreground">IA Predictiva</h1>
            <p className="text-sm text-muted-foreground">Señales preventivas de bienestar</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Resultado experimental</p>
          <div className="mt-2 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">{copy.title}</h2>
            {high || moderate ? <AlertTriangle className="h-6 w-6 text-soul-gold" /> : <ShieldCheck className="h-6 w-6 text-soul-teal" />}
          </div>
          {prediction.riskLevel !== "insuficiente" && (
            <>
              <div className="mt-5 text-5xl font-bold text-foreground">{percent}%</div>
              <p className="mt-1 text-xs text-muted-foreground">señal estimada; no es una probabilidad diagnóstica</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div className={`h-full ${high ? "bg-destructive" : moderate ? "bg-soul-gold" : "bg-soul-teal"}`} style={{ width: `${percent}%` }} />
              </div>
            </>
          )}
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{copy.description}</p>
        </div>

        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">Modelo transparente</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {prediction.modelVersion} · {prediction.featureVersion}. Baseline experimental, no entrenado con un dataset clínico y no destinado a diagnosticar trastornos psicológicos.
          </p>
        </div>

        {prediction.features.length > 0 && (
          <section className="mt-6">
            <h2 className="font-cinzel font-semibold text-foreground">Factores que influyen</h2>
            <div className="mt-3 space-y-2">
              {prediction.features.slice(0, 4).map((feature) => (
                <div key={feature.key} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-foreground">{feature.label}</span>
                    <span className="font-semibold text-primary">{Math.round(feature.contribution * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {high && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-foreground">Considera buscar apoyo profesional</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Si presentas malestar persistente o intenso, contacta al servicio de bienestar universitario o a un profesional de salud mental.</p>
          </div>
        )}

        <p className="mt-5 text-center text-[10px] leading-4 text-muted-foreground">
          Cobertura de datos: {Math.round(prediction.coverage * 100)}%. SoulSync es una herramienta preventiva e investigativa, no una herramienta de diagnóstico.
        </p>
      </div>
    </MobileLayout>
  );
}
