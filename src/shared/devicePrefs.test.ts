// Verifica la lectura de preferencias del dispositivo y la regla de movimiento reducido.
import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, effectiveReduceMotion, parsePrefs } from "./devicePrefs";
import { SOUNDS } from "./sound";

describe("Preferencias del dispositivo", () => {
  it("usa valores por defecto si no hay nada guardado o está dañado", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("{no es json")).toEqual(DEFAULT_PREFS);
    expect(parsePrefs(JSON.stringify({ sound: "sí", haptics: false }))).toEqual({ ...DEFAULT_PREFS, reduceMotion: null, sound: false, haptics: false });
    expect(parsePrefs(JSON.stringify({ reminderEnabled: true, reminderTime: "8pm" }))).toMatchObject({ reminderEnabled: true, reminderTime: "19:00" });
    expect(DEFAULT_PREFS.reminderEnabled).toBe(false);
  });
  it("los sonidos vienen apagados y la vibración encendida", () => {
    expect(DEFAULT_PREFS.sound).toBe(false);
    expect(DEFAULT_PREFS.haptics).toBe(true);
  });
  it("sigue al sistema hasta que el usuario elige", () => {
    expect(effectiveReduceMotion(DEFAULT_PREFS, true)).toBe(true);
    expect(effectiveReduceMotion(DEFAULT_PREFS, false)).toBe(false);
    expect(effectiveReduceMotion({ ...DEFAULT_PREFS, reduceMotion: false }, true)).toBe(false);
    expect(effectiveReduceMotion({ ...DEFAULT_PREFS, reduceMotion: true }, false)).toBe(true);
  });
  it("los efectos de sonido son cortos (menos de 1 segundo)", () => {
    for (const notes of Object.values(SOUNDS)) {
      const end = Math.max(...notes.map(([, start, length]) => start + length));
      expect(end).toBeLessThan(1);
    }
  });
});
