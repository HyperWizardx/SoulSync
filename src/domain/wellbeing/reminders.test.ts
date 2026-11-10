// Pruebas del recordatorio diario: horario permitido, silencio nocturno, aviso y calendario.
import { describe, expect, it } from "vitest";
import {
  REMINDER_SLOTS, buildReminderIcs, clampReminderTime, isQuietHour, msUntilReminder, reminderMessage, shouldNudge, toMinutes,
} from "./reminders";

describe("horario del recordatorio", () => {
  it("solo ofrece horas entre 7:00 y 21:00 cada media hora", () => {
    expect(REMINDER_SLOTS[0]).toBe("07:00");
    expect(REMINDER_SLOTS.at(-1)).toBe("21:00");
    expect(REMINDER_SLOTS).toHaveLength(29);
  });
  it("lleva horas nocturnas o inválidas al horario permitido", () => {
    expect(clampReminderTime("03:00")).toBe("07:00");
    expect(clampReminderTime("23:40")).toBe("21:00");
    expect(clampReminderTime("18:20")).toBe("18:30");
    expect(clampReminderTime("hola")).toBe("19:00");
    expect(clampReminderTime(undefined)).toBe("19:00");
  });
  it("de 22:00 a 7:00 es hora de silencio", () => {
    expect(isQuietHour(toMinutes("22:00"))).toBe(true);
    expect(isQuietHour(toMinutes("06:59"))).toBe(true);
    expect(isQuietHour(toMinutes("07:00"))).toBe(false);
    expect(isQuietHour(toMinutes("21:59"))).toBe(false);
  });
});

describe("aviso", () => {
  const base = { enabled: true, time: "19:00", nowMinutes: toMinutes("19:30"), doneToday: false, dismissedToday: false };
  it("aparece tras la hora elegida si aún no hay misión hoy", () => {
    expect(shouldNudge(base)).toBe(true);
    expect(shouldNudge({ ...base, nowMinutes: toMinutes("18:59") })).toBe(false);
  });
  it("no aparece si está apagado, ya hizo una misión, dijo 'hoy no' o es de noche", () => {
    expect(shouldNudge({ ...base, enabled: false })).toBe(false);
    expect(shouldNudge({ ...base, doneToday: true })).toBe(false);
    expect(shouldNudge({ ...base, dismissedToday: true })).toBe(false);
    expect(shouldNudge({ ...base, time: "21:00", nowMinutes: toMinutes("22:15") })).toBe(false);
  });
  it("calcula cuánto falta para la hora de hoy", () => {
    const now = new Date(2026, 10, 10, 18, 0, 0);
    expect(msUntilReminder("19:00", now)).toBe(3_600_000);
    expect(msUntilReminder("17:00", now)).toBeNull();
  });
  it("el mensaje usa el tono del arquetipo y rota por día", () => {
    expect(reminderMessage(0, 0).body).toMatch(/escudo/);
    expect(reminderMessage(0, 1).body).not.toBe(reminderMessage(0, 0).body);
    expect(reminderMessage(null, 0).body).toMatch(/aventura/);
  });
});

describe("calendario", () => {
  it("crea un evento diario a la hora local con alarma", () => {
    const ics = buildReminderIcs({ time: "20:30", startDate: "2026-11-10", url: "https://soulsync.app/dashboard", body: "Hola; mundo" });
    expect(ics).toContain("DTSTART:20261110T203000");
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("Hola\\; mundo");
    expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });
});
