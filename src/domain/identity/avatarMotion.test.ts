// Verifica la selección del arquetipo y que el avatar no salga del encuadre.
import { describe, expect, it } from "vitest";
import { archetypeModelKey, avatarPosition } from "./avatarMotion";
describe("Compañero AR", () => {
  it("usa el personaje de cada arquetipo elegido", () => {
    expect([0, 1, 2, 3].map(archetypeModelKey)).toEqual(["warrior", "healer", "explorer", "sage"]);
  });
  it("conserva un personaje para perfiles sin arquetipo", () => {
    expect(archetypeModelKey(null)).toBe("explorer");
  });
  it("mantiene el personaje dentro de la zona visible", () => {
    expect(avatarPosition(-10, 120)).toEqual({ x: 20, y: 75 });
    expect(avatarPosition(60, 40)).toEqual({ x: 60, y: 40 });
  });
});