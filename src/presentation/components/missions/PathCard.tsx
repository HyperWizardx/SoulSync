// Ruta guiada "Hacer lo que importa" (guía de la OMS para tiempos de estrés): cinco habilidades
// que se desbloquean en orden. Muestra el avance y el siguiente paso listo para empezar.
import { Check, ChevronRight, Lock } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { PATHS, pathMissions, type Mission, type PathId } from "@/domain/gamification/missionsData";

// Nombre corto de cada habilidad bajo su círculo.
const SHORT: Record<string, string> = { "dwm-1": "Anclarse", "dwm-2": "Soltar", "dwm-3": "Valores", "dwm-4": "Amabilidad", "dwm-5": "Espacio" };

interface Props {
  id: PathId;
  done: ReadonlySet<string>;          // pasos cumplidos alguna vez
  doneToday: ReadonlySet<string>;
  onStart: (m: Mission) => void;
}

export function PathCard({ id, done, doneToday, onStart }: Props) {
  const steps = pathMissions(id);
  const info = PATHS[id];
  const completed = steps.filter((s) => done.has(s.id)).length;
  const next = steps.find((s) => !done.has(s.id));
  return (
    <section className="rounded-2xl border border-soul-gold/40 bg-gradient-to-b from-soul-gold/10 to-card p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-soul-gold">
          <GameIcon name="path-distance" className="h-4 w-4" /> Ruta de la OMS
        </p>
        <span className="text-xs text-muted-foreground">{completed}/{steps.length}</span>
      </div>
      <p className="mt-1 font-cinzel text-lg font-semibold text-foreground">{info.name}</p>
      <p className="text-xs text-muted-foreground">Cinco habilidades para manejar el estrés, paso a paso.</p>

      <ol className="mt-3 flex items-start gap-1.5" aria-label="Pasos de la ruta">
        {steps.map((s) => {
          const isDone = done.has(s.id);
          const isNext = next?.id === s.id;
          return (
            <li key={s.id} className="flex flex-1 flex-col items-center gap-1" title={s.title}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${isDone ? "border-soul-teal bg-soul-teal/15 text-soul-teal" : isNext ? "border-soul-gold bg-soul-gold/15 text-soul-gold" : "border-border text-muted-foreground"}`}>
                {isDone ? <Check className="h-4 w-4" aria-hidden /> : isNext ? <GameIcon name={s.icon} className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" aria-hidden />}
              </span>
              <span className="w-full truncate text-center text-xs text-muted-foreground">{SHORT[s.id] ?? s.title}</span>
            </li>
          );
        })}
      </ol>

      {next ? (
        doneToday.has(next.id) ? null : (
          <button onClick={() => onStart(next)} className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl border border-soul-gold/40 bg-card px-3 py-2 text-left transition-transform active:scale-[0.98]">
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-soul-gold">Paso {next.path?.step}: {next.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{next.desc}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-soul-gold" aria-hidden />
          </button>
        )
      ) : (
        <p className="mt-3 text-sm font-semibold text-soul-teal">¡Completaste la ruta! Puedes repetir cualquier paso cuando lo necesites.</p>
      )}
      <a href={info.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-muted-foreground underline">Basada en la {info.source}</a>
    </section>
  );
}
