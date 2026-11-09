// Verifica hacia qué lado entra la pantalla nueva y el escalonado de las listas.
import { describe, expect, it } from "vitest";
import { navDirection } from "./navOrder";

describe("Transición entre pestañas", () => {
  it("entra desde la derecha al avanzar en la barra y desde la izquierda al retroceder", () => {
    expect(navDirection("/dashboard", "/missions")).toBe(1);
    expect(navDirection("/profile", "/world")).toBe(-1);
  });
  it("usa la entrada vertical cuando una de las pantallas no es una pestaña", () => {
    expect(navDirection("/dashboard", "/store")).toBe(0);
    expect(navDirection("/world", "/world")).toBe(0);
  });
});
