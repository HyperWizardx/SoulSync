// Respuestas en misiones (rol psicología): lo que el estudiante respondió en quiz, pasos y reto del
// día y, solo si lo autorizó, lo que escribió. Da base y trazabilidad al acompañamiento.
import { useMemo, useState } from "react";
import { Check, Lock, X } from "lucide-react";
import { RESPONSE_KIND_LABEL, responseSummary, type MissionResponseRecord, type ResponseKind } from "@/domain/gamification/missionResponses";

type Filter = "todas" | "quiz" | "escritos" | "pasos";
const FILTERS: { key: Filter; label: string; kinds: ResponseKind[] }[] = [
  { key: "todas", label: "Todas", kinds: ["quiz", "texto", "gratitud", "pasos", "reto"] },
  { key: "quiz", label: "Quiz", kinds: ["quiz"] },
  { key: "escritos", label: "Escritos", kinds: ["texto", "gratitud"] },
  { key: "pasos", label: "Pasos y retos", kinds: ["pasos", "reto"] },
];

function Detail({ r }: { r: MissionResponseRecord }) {
  const res = r.response;
  switch (res.kind) {
    case "quiz":
      return (
        <ol className="mt-2 space-y-1.5 text-xs">
          {res.answers.map((a, i) => (
            <li key={i} className="rounded-lg bg-secondary/40 p-2">
              <p className="text-muted-foreground">{i + 1}. {a.question}</p>
              <p className={`mt-0.5 flex items-center gap-1 ${a.correct ? "text-soul-teal" : "text-destructive"}`}>
                {a.correct ? <Check className="h-3.5 w-3.5" aria-label="Correcta" /> : <X className="h-3.5 w-3.5" aria-label="Incorrecta" />}
                {a.chosen ?? "Sin respuesta"}
              </p>
            </li>
          ))}
        </ol>
      );
    case "pasos":
      return (
        <ul className="mt-2 space-y-1 text-xs">
          {res.steps.map((s, i) => (
            <li key={i} className={`flex items-start gap-1.5 ${s.done ? "text-foreground" : "text-muted-foreground line-through"}`}>
              {s.done ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-soul-teal" aria-hidden /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />}
              {s.step}
            </li>
          ))}
        </ul>
      );
    case "texto":
      return res.text
        ? <p className="mt-2 whitespace-pre-wrap rounded-lg bg-secondary/40 p-2 text-xs text-foreground">{res.text}</p>
        : <Private />;
    case "gratitud":
      return res.items
        ? <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-foreground">{res.items.map((x, i) => <li key={i}>{x}</li>)}</ul>
        : <Private />;
    case "reto":
      return null;
  }
}

function Private() {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5" aria-hidden /> El estudiante no autorizó compartir sus escritos.
    </p>
  );
}

export function MissionResponses({ items }: { items: MissionResponseRecord[] }) {
  const [filter, setFilter] = useState<Filter>("todas");
  const [open, setOpen] = useState<string | null>(null);
  const shown = useMemo(() => {
    const kinds = FILTERS.find((f) => f.key === filter)!.kinds;
    return items.filter((r) => kinds.includes(r.response.kind));
  }, [items, filter]);
  const quizzes = items.filter((r) => r.response.kind === "quiz");
  const avg = quizzes.length
    ? Math.round((quizzes.reduce((s, r) => s + (r.response.kind === "quiz" ? r.response.score / Math.max(1, r.response.total) : 0), 0) / quizzes.length) * 100)
    : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="responses-title">
      <h2 id="responses-title" className="font-semibold text-foreground">Respuestas en misiones</h2>
      <p className="text-xs text-muted-foreground">
        Últimas {items.length} respuestas. Los escritos solo aparecen si el estudiante lo autorizó.{avg !== null ? ` Aciertos promedio en quiz: ${avg}%.` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar respuestas">
        {FILTERS.map((f) => (
          <button key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)}
            className={`min-h-8 rounded-full border px-3 text-xs font-semibold ${filter === f.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">Aún no hay respuestas de este tipo.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {shown.map((r) => {
            const expandable = r.response.kind !== "reto";
            const isOpen = open === r.id;
            return (
              <li key={r.id} className="rounded-xl border border-border p-3">
                <button
                  onClick={() => expandable && setOpen(isOpen ? null : r.id)}
                  aria-expanded={expandable ? isOpen : undefined}
                  className="flex w-full items-start justify-between gap-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{r.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })} · {responseSummary(r.response)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground">{RESPONSE_KIND_LABEL[r.response.kind]}</span>
                </button>
                {isOpen && <Detail r={r} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
