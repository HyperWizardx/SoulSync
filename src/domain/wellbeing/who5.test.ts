// Verifica el puntaje, la interpretación y la frecuencia del Índice de Bienestar WHO-5.
import { describe, expect, it } from "vitest";
import { WHO5_ITEMS, WHO5_OPTIONS, SEVERE_SCALE_DISTRESS, scaleDistress, who5Band, who5DaysLeft, who5Due, who5Percent, who5Raw } from "./who5";

describe("WHO-5", () => {
  it("tiene 5 afirmaciones y 6 opciones de 5 a 0", () => {
    expect(WHO5_ITEMS).toHaveLength(5);
    expect(WHO5_OPTIONS.map((o) => o.value)).toEqual([5, 4, 3, 2, 1, 0]);
  });
  it("suma las respuestas y rechaza respuestas incompletas o fuera de rango", () => {
    expect(who5Raw([5, 4, 3, 2, 1])).toBe(15);
    expect(who5Raw([5, 4, 3, 2])).toBeNull();
    expect(who5Raw([6, 0, 0, 0, 0])).toBeNull();
    expect(who5Percent(15)).toBe(60);
  });
  it("aplica los puntos de corte: ≤ 7 muy bajo, < 13 bajo", () => {
    expect(who5Band(7)).toBe("muy_bajo");
    expect(who5Band(8)).toBe("bajo");
    expect(who5Band(12)).toBe("bajo");
    expect(who5Band(13)).toBe("bueno");
  });
  it("se pide cada 14 días", () => {
    expect(who5Due(null, "2026-11-10")).toBe(true);
    expect(who5Due("2026-11-01", "2026-11-10")).toBe(false);
    expect(who5Due("2026-10-27", "2026-11-10")).toBe(true);
    expect(who5DaysLeft("2026-11-01", "2026-11-10")).toBe(5);
  });
  it("invierte el malestar en WHO-5 y lo deja igual en escalas de síntomas", () => {
    expect(scaleDistress("WHO5", 25, 25)).toBe(0);
    expect(scaleDistress("WHO5", 7, 25)).toBeGreaterThanOrEqual(SEVERE_SCALE_DISTRESS);
    expect(scaleDistress("WHO5", 8, 25)).toBeLessThan(SEVERE_SCALE_DISTRESS);
    expect(scaleDistress("phq-like", 20, 27)).toBeCloseTo(20 / 27);
  });
});
