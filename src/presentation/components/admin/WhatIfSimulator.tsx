/** Simulador "¿y si...?": ejecuta el modelo real sobre indicadores hipotéticos. No guarda nada. */
import { useMemo, useState } from "react";
import { PRESETS, SIM_FEATURES, simulate, type Scenario } from "@/application/research/simulate";
import { FEATURE_LABELS } from "@/domain/wellbeing/copy";
import { useStudentDetail } from "@/presentation/hooks/useAdmin";

interface Props {
  participants: { userId: string; participantCode: string }[];
}

export function WhatIfSimulator({ participants }: Props) {
  const [scenario, setScenario] = useState<Scenario>(PRESETS[1].scenario);
  const [checkins, setCheckins] = useState(7);
  const [selected, setSelected] = useState("");
  const detail = useStudentDetail(selected, Boolean(selected));
  const result = useMemo(() => simulate(scenario, checkins), [scenario, checkins]);

  const loadParticipant = () => {
    const exp = detail.data?.explanation ?? [];
    if (exp.length === 0) return;
    const next: Scenario = {};
    for (const k of SIM_FEATURES) next[k] = null;
    for (const f of exp) next[f.key] = f.value;
    setScenario(next);
  };

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4">
      <h2 className="font-semibold text-foreground">Simulador ¿y si...?</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Herramienta exploratoria de explicabilidad. Usa el mismo modelo de la app; no guarda datos ni es un diagnóstico.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.key} onClick={() => setScenario(p.scenario)} className="rounded-xl border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary">
            {p.label}
          </button>
        ))}
        <select
          aria-label="Participante"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-8 rounded-xl border border-border bg-secondary/40 px-2 text-xs text-foreground"
        >
          <option value="">Elegir participante…</option>
          {participants.map((p) => <option key={p.userId} value={p.userId}>{p.participantCode}</option>)}
        </select>
        <button
          disabled={!selected || detail.isLoading || (detail.data?.explanation ?? []).length === 0}
          onClick={loadParticipant}
          className="rounded-xl border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary disabled:opacity-50"
        >
          {detail.isLoading ? "Cargando…" : "Cargar desde participante"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs text-muted-foreground">
            Check-ins en 14 días: <span className="font-semibold text-foreground">{checkins}</span>
            <input type="range" min={0} max={14} value={checkins} onChange={(e) => setCheckins(Number(e.target.value))} className="w-full accent-primary" />
          </label>
          {SIM_FEATURES.map((k) => {
            const v = scenario[k];
            const off = v === null || v === undefined;
            return (
              <div key={k} className="text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{FEATURE_LABELS[k]}</span>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={!off} onChange={(e) => setScenario((s) => ({ ...s, [k]: e.target.checked ? 0.5 : null }))} />
                    <span className="w-8 text-right text-foreground">{off ? "—" : (v as number).toFixed(2)}</span>
                  </label>
                </div>
                <input
                  type="range" min={0} max={1} step={0.05} disabled={off} aria-label={FEATURE_LABELS[k]}
                  value={off ? 0 : (v as number)}
                  onChange={(e) => setScenario((s) => ({ ...s, [k]: Number(e.target.value) }))}
                  className="w-full accent-primary disabled:opacity-40"
                />
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xl font-bold capitalize text-foreground">{result.riskLevel}</p>
              <p className="text-xs text-muted-foreground">Nivel</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xl font-bold text-foreground">{result.score === null ? "—" : result.score.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Puntaje</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xl font-bold text-foreground">{Math.round(result.coverage * 100)}%</p>
              <p className="text-xs text-muted-foreground">Cobertura</p>
            </div>
          </div>
          {result.insufficientReason && <p className="mb-2 text-xs text-muted-foreground">{result.insufficientReason}</p>}
          <div className="space-y-1.5">
            {result.explanation.map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{f.label}</span>
                  <span>{(f.contribution * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${f.direction === "riesgo" ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, f.contribution * 400)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
