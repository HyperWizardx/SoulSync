// Verifica la selección del arquetipo, su animación y que el avatar no salga del encuadre.
import { describe, expect, it } from "vitest";
import { archetypeModelKey, avatarAnimation, avatarFacing, avatarPosition, avatarZoom } from "./avatarMotion";
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
});
