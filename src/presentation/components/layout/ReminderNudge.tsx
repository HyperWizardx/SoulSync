// Aviso amable del recordatorio diario: aparece sobre la barra inferior tras la hora elegida si
// aún no hay misión hoy. Lleva a "Tu siguiente paso" y se cierra con "Hoy no" o se apaga del todo.
import { Link, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useDailyReminder } from "@/presentation/hooks/useDailyReminder";

export function ReminderNudge() {
  const { visible, message, dismiss, turnOff } = useDailyReminder();
  const path = useRouterState({ select: (s) => s.location.pathname });
  // En Misiones ya está donde el aviso lo llevaría.
  if (!visible || path.startsWith("/missions")) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-20 z-40 mx-auto w-full max-w-[430px] px-3">
      <div className="flex items-start gap-3 rounded-2xl border border-soul-gold/40 bg-card/95 p-3 shadow-lg backdrop-blur">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soul-gold/15 text-soul-gold">
          <GameIcon name="alarm-clock" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Tu aventura te espera</p>
          <p className="text-xs text-muted-foreground">{message.body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link to="/missions" onClick={dismiss} className="flex min-h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">
              Ir a misiones
            </Link>
            <button onClick={dismiss} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-muted-foreground">Hoy no</button>
            <button onClick={turnOff} aria-label="Apagar recordatorios" className="min-h-9 rounded-lg px-2 text-xs text-muted-foreground underline underline-offset-2">Apagar</button>
          </div>
        </div>
        <button onClick={dismiss} aria-label="Cerrar recordatorio" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
