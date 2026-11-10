// "Movimiento de la semana": la meta de la OMS (150 min de actividad moderada, la vigorosa cuenta
// doble, y fuerza 2 días). Muestra el avance de lunes a hoy y permite registrar minutos.
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useActivity } from "@/presentation/hooks/useActivity";
import { INTENSITY_HINT, WHO_STRENGTH_DAYS, WHO_WEEKLY_MINUTES, type Intensity } from "@/domain/wellbeing/activity";

const MINUTES = [10, 15, 20, 30, 45, 60];

export function ActivityCard() {
  const { data, isLoading, log } = useActivity();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(20);
  const [intensity, setIntensity] = useState<Intensity>("moderada");
  const [strength, setStrength] = useState(false);

  if (isLoading || !data) return <div className="h-28 animate-pulse rounded-2xl bg-card" aria-busy="true" />;
  const w = data.week;
  const left = Math.max(0, WHO_WEEKLY_MINUTES - w.equivalentMinutes);

  const save = () => {
    log.mutate({ minutes, intensity, strength }, { onSuccess: () => { setOpen(false); setStrength(false); } });
  };

  return (
    <section className={`rounded-2xl border p-4 ${w.goalMet ? "border-soul-teal/50 bg-soul-teal/10" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <GameIcon name="run" className="h-4 w-4 text-soul-gold" /> Movimiento de la semana
        </p>
        <span className={`text-sm font-bold ${w.goalMet ? "text-soul-teal" : "text-foreground"}`}>
          {w.equivalentMinutes} / {WHO_WEEKLY_MINUTES} min
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full transition-all duration-700 ${w.goalMet ? "bg-soul-teal" : "bg-soul-gold"}`} style={{ width: `${w.percent}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{w.goalMet ? "¡Meta de la OMS cumplida! Tu cuerpo te lo agradece." : `Te faltan ${left} min para la meta de la OMS.`}</span>
        <span className="flex shrink-0 items-center gap-1" aria-label={`Fuerza: ${w.strengthDays} de ${WHO_STRENGTH_DAYS} días`}>
          <GameIcon name="muscle-up" className="h-3.5 w-3.5" /> {Math.min(w.strengthDays, WHO_STRENGTH_DAYS)}/{WHO_STRENGTH_DAYS}
        </span>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-soul-gold/40 bg-soul-gold/10 text-sm font-semibold text-soul-gold transition-transform active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden /> Registrar actividad de hoy
        </button>
      ) : (
        <div className="mt-3 space-y-3 rounded-xl border border-border bg-background/40 p-3">
          <div>
            <p className="text-xs font-medium text-foreground">¿Cuántos minutos te moviste?</p>
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {MINUTES.map((m) => (
                <button key={m} onClick={() => setMinutes(m)} aria-pressed={minutes === m}
                  className={`min-h-10 rounded-lg border text-sm font-semibold ${minutes === m ? "border-soul-gold bg-soul-gold/15 text-soul-gold" : "border-border text-muted-foreground"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">¿Qué tan intenso fue?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["moderada", "vigorosa"] as const).map((i) => (
                <button key={i} onClick={() => setIntensity(i)} aria-pressed={intensity === i}
                  className={`min-h-10 rounded-lg border text-sm font-semibold capitalize ${intensity === i ? "border-soul-gold bg-soul-gold/15 text-soul-gold" : "border-border text-muted-foreground"}`}>
                  {i}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{INTENSITY_HINT[intensity]}{intensity === "vigorosa" ? " Cuenta doble." : ""}</p>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={strength} onChange={(e) => setStrength(e.target.checked)} className="h-4 w-4 accent-[var(--color-soul-gold)]" />
            Incluyó ejercicios de fuerza (flexiones, sentadillas, pesas)
          </label>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="min-h-11 flex-1 rounded-xl border border-border text-sm text-muted-foreground">Cancelar</button>
            <button onClick={save} disabled={log.isPending}
              className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
              <Check className="h-4 w-4" aria-hidden /> {log.isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
