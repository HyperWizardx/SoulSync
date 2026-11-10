// Recordatorio diario en este dispositivo: decide si mostrar el aviso amable (tras la hora elegida,
// nunca de noche y solo si aún no hay misión hoy) y, si la app está en segundo plano y el
// navegador lo permite, lanza una notificación del sistema una sola vez por día.
import { useEffect, useState } from "react";
import { useDevicePrefs } from "@/presentation/hooks/useDevicePrefs";
import { useUserStore } from "@/presentation/hooks/useUserStore";
import { localToday } from "@/presentation/hooks/useActivity";
import { reminderMessage, shouldNudge } from "@/domain/wellbeing/reminders";

const dayIndex = (iso: string) => Math.floor(Date.parse(`${iso}T12:00:00Z`) / 86_400_000);
export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

export function useDailyReminder() {
  const { prefs, setPrefs } = useDevicePrefs();
  const { user } = useUserStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!prefs.reminderEnabled) return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [prefs.reminderEnabled]);

  const today = localToday();
  const doneToday = user.missionHistory.some((m) => m.date === now.toDateString());
  const visible = shouldNudge({
    enabled: prefs.reminderEnabled,
    time: prefs.reminderTime,
    nowMinutes: now.getHours() * 60 + now.getMinutes(),
    doneToday,
    dismissedToday: prefs.reminderShownOn === today,
  });
  const message = reminderMessage(user.archetype, dayIndex(today));

  // Con la app abierta en segundo plano: notificación del sistema (una vez al día).
  useEffect(() => {
    if (!visible || !notificationsSupported() || Notification.permission !== "granted") return;
    if (document.visibilityState === "visible") return;
    try {
      const n = new Notification(message.title, { body: message.body, icon: "/favicon.png", tag: "soulsync-recordatorio" });
      n.onclick = () => { window.focus(); n.close(); };
      setPrefs({ reminderShownOn: today });
    } catch { /* algunos móviles solo permiten notificaciones desde un service worker */ }
  }, [visible, message.title, message.body, setPrefs, today]);

  return {
    visible,
    message,
    /** "Hoy no": no vuelve a aparecer hasta mañana. */
    dismiss: () => setPrefs({ reminderShownOn: today }),
    turnOff: () => setPrefs({ reminderEnabled: false }),
  };
}
