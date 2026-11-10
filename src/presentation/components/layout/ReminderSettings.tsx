// Ajustes del recordatorio diario (Perfil): encender/apagar, hora (7:00–21:00), avisos del
// navegador y evento de calendario para que avise cada día aunque la app esté cerrada.
import { useEffect, useState } from "react";
import { CalendarPlus, BellRing } from "lucide-react";
import { toast } from "sonner";
import { PrefSwitch } from "@/presentation/components/layout/PrefSwitch";
import { useDevicePrefs } from "@/presentation/hooks/useDevicePrefs";
import { notificationsSupported } from "@/presentation/hooks/useDailyReminder";
import { localToday } from "@/presentation/hooks/useActivity";
import { REMINDER_SLOTS, buildReminderIcs, clampReminderTime, reminderMessage } from "@/domain/wellbeing/reminders";

/** "19:00" → "7:00 p. m." (como lo lee el estudiante). */
export function formatSlot(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  return new Date(2026, 0, 1, h, m).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

export function ReminderSettings({ archetype }: { archetype: number | null }) {
  const { prefs, setPrefs } = useDevicePrefs();
  const time = clampReminderTime(prefs.reminderTime);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  useEffect(() => { setPermission(notificationsSupported() ? Notification.permission : "unsupported"); }, []);

  const askPermission = async () => {
    if (!notificationsSupported()) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") toast.success("Listo: te avisaremos también con la app en segundo plano.");
  };

  const downloadIcs = () => {
    const ics = buildReminderIcs({
      time,
      startDate: localToday(),
      url: `${window.location.origin}/dashboard`,
      body: reminderMessage(archetype, 0).body,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "soulsync-recordatorio.ics";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Ábrelo para añadirlo a tu calendario.");
  };

  return (
    <div className="space-y-2">
      <PrefSwitch
        label="Recordatorio diario"
        hint={prefs.reminderEnabled ? `Cada día a las ${formatSlot(time)}, solo si aún no has hecho una misión` : "Un aviso amable a la hora que elijas, nunca de noche"}
        checked={prefs.reminderEnabled}
        onChange={(v) => { setPrefs({ reminderEnabled: v, reminderTime: time }); if (v && permission === "default") void askPermission(); }}
      />
      {prefs.reminderEnabled && (
        <div className="space-y-2 rounded-lg bg-secondary/60 p-3">
          <label className="flex items-center justify-between gap-3 text-sm text-foreground">
            Hora del aviso
            <select
              value={time}
              onChange={(e) => setPrefs({ reminderTime: e.target.value, reminderShownOn: null })}
              className="min-h-10 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
            >
              {REMINDER_SLOTS.map((s) => <option key={s} value={s}>{formatSlot(s)}</option>)}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">Solo entre 7:00 a. m. y 9:00 p. m.: tus noches son para descansar.</p>
          {permission === "default" && (
            <button onClick={askPermission} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground">
              <BellRing className="h-4 w-4" aria-hidden /> Permitir avisos del navegador
            </button>
          )}
          {permission === "denied" && (
            <p className="text-xs text-muted-foreground">Los avisos del navegador están bloqueados: verás el recordatorio dentro de la app.</p>
          )}
          <button onClick={downloadIcs} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/5 text-xs font-semibold text-primary">
            <CalendarPlus className="h-4 w-4" aria-hidden /> Añadir a mi calendario
          </button>
          <p className="text-xs text-muted-foreground">Tu calendario te avisará cada día aunque la app esté cerrada. Para quitarlo, bórralo desde tu calendario.</p>
        </div>
      )}
    </div>
  );
}
