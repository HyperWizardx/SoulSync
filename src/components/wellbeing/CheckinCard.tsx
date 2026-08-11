import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { CheckinRecord } from "@/lib/wellbeing/types";

const SCALES = [
  { key: "mood" as const, label: "¿Cómo está tu ánimo hoy?", low: "Muy bajo", high: "Muy bien" },
  { key: "stress" as const, label: "¿Cuánto estrés sientes?", low: "Nada", high: "Muchísimo" },
  { key: "energy" as const, label: "¿Cuánta energía tienes?", low: "Ninguna", high: "Mucha" },
  { key: "social" as const, label: "¿Qué tan conectado te sientes con otros?", low: "Aislado", high: "Muy conectado" },
];

interface Props {
  today: CheckinRecord | null;
  pending: boolean;
  onSubmit: (v: { mood: number; stress: number; energy: number; social: number; sleepHours: number | null }) => void;
}

export function CheckinCard({ today, pending, onSubmit }: Props) {
  const [values, setValues] = useState({
    mood: today?.mood ?? 3,
    stress: today?.stress ?? 3,
    energy: today?.energy ?? 3,
    social: today?.social ?? 3,
  });
  const [sleep, setSleep] = useState<string>(today?.sleepHours != null ? String(today.sleepHours) : "");
  const [open, setOpen] = useState(!today);

  if (today && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full min-h-11 items-center gap-3 rounded-2xl border border-soul-teal/30 bg-soul-teal/5 p-4 text-left transition-all active:scale-[0.98]"
      >
        <CheckCircle2 className="h-5 w-5 text-soul-teal" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Check-in de hoy completado</p>
          <p className="text-xs text-muted-foreground">Toca para editarlo</p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-cinzel font-semibold text-foreground">Check-in de hoy</h2>
      <p className="mt-1 text-xs text-muted-foreground">Cuatro preguntas rápidas. Alimentan tu señal preventiva.</p>

      <div className="mt-4 space-y-4">
        {SCALES.map((s) => (
          <div key={s.key}>
            <p className="text-xs font-medium text-foreground">{s.label}</p>
            <div className="mt-2 flex gap-2" role="group" aria-label={s.label}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`${s.label} — ${n} de 5`}
                  aria-pressed={values[s.key] === n}
                  onClick={() => setValues((v) => ({ ...v, [s.key]: n }))}
                  className={`h-11 flex-1 rounded-lg border text-sm font-semibold transition-all active:scale-95 ${
                    values[s.key] === n
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>{s.low}</span>
              <span>{s.high}</span>
            </div>
          </div>
        ))}

        <div>
          <label htmlFor="sleep-hours" className="text-xs font-medium text-foreground">
            Horas de sueño anoche (opcional)
          </label>
          <input
            id="sleep-hours"
            type="number"
            inputMode="decimal"
            min={0}
            max={24}
            step={0.5}
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            placeholder="Ej. 7"
            className="mt-2 h-11 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      <button
        disabled={pending}
        onClick={() => {
          const parsed = sleep.trim() === "" ? null : Number(sleep);
          const sleepHours = parsed !== null && Number.isFinite(parsed) && parsed >= 0 && parsed <= 24 ? parsed : null;
          onSubmit({ ...values, sleepHours });
          setOpen(false);
        }}
        className="mt-4 min-h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar check-in"}
      </button>
    </div>
  );
}
