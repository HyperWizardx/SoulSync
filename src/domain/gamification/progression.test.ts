/** Pruebas de las reglas de progresión del dominio. */
import { describe, expect, it } from "vitest";
import { applyDeltas, applyXp, isEffectActive, nextStreak } from "./progression";

const base = { today: "2026-10-20", yesterday: "2026-10-19" };

describe("progresión", () => {
  it("cada 600 XP se sube un nivel", () => {
    expect(applyXp(550, 2, 100)).toEqual({ xp: 50, level: 3, leveledUp: true });
    expect(applyXp(0, 1, 1250)).toEqual({ xp: 50, level: 3, leveledUp: true });
    expect(applyXp(10, 1, 20).leveledUp).toBe(false);
  });
  it("la racha sube si la última misión fue ayer", () => {
    expect(nextStreak({ ...base, last: "2026-10-19", streak: 4, hasShield: false })).toEqual({ streak: 5, shieldUsed: false });
  });
  it("la racha no cambia con una segunda misión el mismo día", () => {
    expect(nextStreak({ ...base, last: "2026-10-20", streak: 4, hasShield: true }).streak).toBe(4);
  });
  it("el escudo salva la racha tras un hueco y se gasta", () => {
    expect(nextStreak({ ...base, last: "2026-10-15", streak: 4, hasShield: true })).toEqual({ streak: 5, shieldUsed: true });
  });
  it("sin escudo un hueco reinicia la racha a 1", () => {
    expect(nextStreak({ ...base, last: "2026-10-15", streak: 4, hasShield: false }).streak).toBe(1);
  });
  it("los atributos quedan entre 0 y 100", () => {
    expect(applyDeltas({ a: 98, b: 2 }, { a: 5, b: -5 })).toEqual({ a: 100, b: 0 });
  });
  it("un efecto sin usos o expirado no está activo", () => {
    expect(isEffectActive({ uses_left: 0, expires_at: null })).toBe(false);
    expect(isEffectActive({ uses_left: null, expires_at: "2000-01-01T00:00:00Z" })).toBe(false);
    expect(isEffectActive({ uses_left: 2, expires_at: null })).toBe(true);
  });
});
