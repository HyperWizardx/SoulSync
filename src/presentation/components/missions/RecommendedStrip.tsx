// "Elegidas para ti": las misiones que el recomendador propio (muestreo de Thompson) eligió hoy,
// cada una con su razón (lo aprendido de tus check-ins y votos, la afinidad o la exploración).
// "Otras opciones" pide otra muestra del mismo modelo, sin olvidar lo aprendido.
import { useState } from "react";
import { ChevronRight, Shuffle, Sparkles } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useRecommendations } from "@/presentation/hooks/useRecommendations";
import { getMissionById, type Mission } from "@/domain/gamification/missionsData";

export function RecommendedStrip({ onStart, exclude }: { onStart: (m: Mission) => void; exclude: ReadonlySet<string> }) {
  const [reroll, setReroll] = useState(0);
  const { data, isLoading, isFetching } = useRecommendations(reroll);
  if (isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-card" aria-busy="true" />;
  const recs = (data?.recommendations ?? []).filter((r) => !exclude.has(r.missionId));
  if (!data || recs.length === 0) return null;
  return (
    <section className="rounded-2xl border border-primary/40 bg-primary/5 p-3" aria-label="Elegidas para ti">
      <div className="flex items-center justify-between px-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Elegidas para ti
        </p>
        <button
          onClick={() => setReroll((r) => (r + 1) % 50)}
          disabled={isFetching}
          className="flex min-h-9 items-center gap-1 rounded-full px-2 text-xs font-semibold text-primary disabled:opacity-60"
        >
          <Shuffle className={`h-3.5 w-3.5 ${isFetching ? "animate-pulse" : ""}`} aria-hidden /> Otras opciones
        </button>
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        {data.insight ?? (data.learning ? "Aprende de tus check-ins y de lo que te sirve" : "Aún te está conociendo: dime si cada misión te sirvió")}
      </p>
      <ul className="mt-2 space-y-2">
        {recs.map((r) => {
          const m = getMissionById(r.missionId);
          if (!m) return null;
          return (
            <li key={r.missionId}>
              <button onClick={() => onStart(m)} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-left transition-transform active:scale-[0.98]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><GameIcon name={m.icon} className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{m.title}</span>
                  <span className="block text-xs text-muted-foreground">{r.reason}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
