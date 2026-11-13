// Verifica la selección del arquetipo, su animación y que el avatar no salga del encuadre.
import { describe, expect, it } from "vitest";
import { AVATAR_GESTURES, GESTURE_DELAY, archetypeModelKey, avatarAnimation, avatarFacing, avatarPosition, avatarZoom, nextGestureDelay, pickGesture, playsOnce } from "./avatarMotion";
describe("Compañero AR", () => {
  it("usa el personaje de cada arquetipo elegido", () => {
    expect([0, 1, 2, 3].map(archetypeModelKey)).toEqual(["warrior", "barbarian", "explorer", "sage"]);
  });
  it("conserva un personaje para perfiles sin arquetipo", () => {
    expect(archetypeModelKey(null)).toBe("explorer");
  });
  it("mantiene el personaje dentro de la zona visible", () => {
    expect(avatarPosition(-10, 120)).toEqual({ x: 20, y: 75 });
    expect(avatarPosition(60, 40)).toEqual({ x: 60, y: 40 });
  });
  it("camina durante la misión, celebra al subir de nivel y reposa el resto del tiempo", () => {
    expect(avatarAnimation({})).toBe("Idle");
    expect(avatarAnimation({ walking: true })).toBe("Walking_A");
    expect(avatarAnimation({ walking: true, celebrating: true })).toBe("Cheer");
  });
  it("limita el tamaño elegido por el usuario combinado con el de la misión", () => {
    expect(avatarZoom(1, 1)).toBe(1);
    expect(avatarZoom(1.5, 1.5)).toBe(1.8);
    expect(avatarZoom(0.5, 1)).toBe(0.6);
    expect(avatarZoom(Number.NaN)).toBe(1);
  });
  it("gira al personaje por el camino más corto", () => {
    expect(avatarFacing(0)).toBe(0);
    expect(avatarFacing(-45)).toBe(-45);
    expect(avatarFacing(225)).toBe(-135);
    expect(avatarFacing(540)).toBe(180);
  });
  it("respeta la preferencia de movimiento reducido", () => {
    expect(avatarAnimation({ walking: true, celebrating: true, reducedMotion: true })).toBe("Idle");
  });
  it("hace un gesto ocasional solo cuando está en reposo", () => {
    expect(avatarAnimation({ gesture: "Wave" })).toBe("Wave");
    expect(avatarAnimation({ gesture: "Hop", walking: true })).toBe("Walking_A");
    expect(avatarAnimation({ gesture: "Signature", celebrating: true })).toBe("Cheer");
    expect(avatarAnimation({ gesture: "Wave", reducedMotion: true })).toBe("Idle");
  });
  it("elige gestos sin repetir el anterior", () => {
    for (const r of [0, 0.4, 0.99, 1]) {
      expect(AVATAR_GESTURES).toContain(pickGesture(r));
      expect(pickGesture(r, "Wave")).not.toBe("Wave");
    }
    expect(pickGesture(Number.NaN)).toBe("Wave");
  });
  it("espacia los gestos dentro de la pausa definida", () => {
    expect(nextGestureDelay(0)).toBe(GESTURE_DELAY.min);
    expect(nextGestureDelay(1)).toBe(GESTURE_DELAY.max);
    expect(nextGestureDelay(-3)).toBe(GESTURE_DELAY.min);
    expect(nextGestureDelay(Number.NaN)).toBeGreaterThan(GESTURE_DELAY.min);
  });
  it("reproduce una sola vez los gestos y la celebración", () => {
    expect(["Cheer", "Wave", "Hop", "Signature"].every((n) => playsOnce(n as never))).toBe(true);
    expect(playsOnce("Idle") || playsOnce("Walking_A")).toBe(false);
  });
});
