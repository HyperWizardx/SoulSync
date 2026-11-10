// Ficha del aventurero (opcional): edad, género y semestre por tramos, siempre con "Prefiero no
// decir". Solo sirve para comprobar que la brújula trate igual de bien a todos los grupos.
import { useState } from "react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useParticipantProfile } from "@/presentation/hooks/useParticipantProfile";
import { AGE_BANDS, GENDERS, SEMESTER_BANDS, type ParticipantProfile } from "@/domain/research/participant";
import { UNDISCLOSED } from "@/domain/research/equity";

const FIELDS: { key: keyof ParticipantProfile; label: string; options: Record<string, string> }[] = [
  { key: "ageBand", label: "Edad", options: AGE_BANDS },
  { key: "gender", label: "Género", options: GENDERS },
  { key: "semesterBand", label: "Semestre", options: SEMESTER_BANDS },
];

const EMPTY: ParticipantProfile = { ageBand: UNDISCLOSED, gender: UNDISCLOSED, semesterBand: UNDISCLOSED };

export function ParticipantProfileCard() {
  const { data: profile, isLoading, save, remove } = useParticipantProfile(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ParticipantProfile>(EMPTY);
  if (isLoading) return null;
  const showForm = editing || !profile;

  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="ficha-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GameIcon name="scroll-quill" className="h-6 w-6" />
        </span>
        <div>
          <h2 id="ficha-title" className="font-cinzel font-semibold text-foreground">Ficha del aventurero <span className="text-xs font-normal text-muted-foreground">(opcional)</span></h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Nos ayuda a comprobar que tu brújula funcione igual de bien para todas las personas. El equipo de investigación
            solo la usa agrupada y sin tu nombre. Puedes borrarla cuando quieras.
          </p>
        </div>
      </div>

      {showForm ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => { e.preventDefault(); save.mutate(draft, { onSuccess: () => setEditing(false) }); }}
        >
          {FIELDS.map((f) => (
            <label key={f.key} className="flex items-center justify-between gap-3 text-sm text-foreground">
              {f.label}
              <select
                value={draft[f.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                className="min-h-10 w-44 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
              >
                {Object.entries(f.options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <button disabled={save.isPending} className="min-h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
              Guardar ficha
            </button>
            {profile && (
              <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-xl px-3 text-sm text-muted-foreground">Cancelar</button>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {FIELDS.map((f) => (
              <span key={f.key} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground">
                {f.label}: {f.options[profile[f.key]] ?? "—"}
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-xs">
            <button onClick={() => { setDraft(profile); setEditing(true); }} className="min-h-9 font-semibold text-primary">Editar</button>
            <button onClick={() => remove.mutate()} disabled={remove.isPending} className="min-h-9 text-muted-foreground underline underline-offset-2">Borrar mi ficha</button>
          </div>
        </div>
      )}
    </section>
  );
}
