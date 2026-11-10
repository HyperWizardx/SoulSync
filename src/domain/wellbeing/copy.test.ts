// Títulos antiguos de la crónica: concordancia de género al mostrarlos.
import { describe, expect, it } from "vitest";
import { displayTimelineTitle } from "./copy";

describe("displayTimelineTitle", () => {
  it("corrige los títulos antiguos y deja intactos los demás", () => {
    expect(displayTimelineTitle("Señal bajo · tendencia estable")).toBe("Señal baja · tendencia estable");
    expect(displayTimelineTitle("Señal moderado · tendencia mejorando")).toBe("Señal moderada · tendencia mejorando");
    expect(displayTimelineTitle("Señal alto · tendencia empeorando")).toBe("Señal alta · tendencia empeorando");
    expect(displayTimelineTitle("Misión cumplida: Anclarse")).toBe("Misión cumplida: Anclarse");
  });
});
