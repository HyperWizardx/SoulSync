// Pruebas del pronóstico de ánimo (Holt amortiguado ajustado por estudiante).
import { describe, expect, it } from "vitest";
import { backtestForecast, fitHolt, forecastMood, forecastSeries, holt } from "./forecast";
import type { CheckinRecord } from "./types";

const today = "2026-11-10";
const serie = (moods: number[]): CheckinRecord[] =>
  moods.map((mood, i) => ({ date: new Date(Date.parse(`${today}T12:00:00Z`) - (moods.length - 1 - i) * 86_400_000).toISOString().slice(0, 10), mood, stress: 3, energy: 3, social: 3 }));

describe("Holt", () => {
  it("sigue una serie constante sin error", () => {
    const { level, trend, errors } = holt([3, 3, 3, 3, 3], 0.5, 0.1);
    expect(level).toBe(3);
    expect(trend).toBe(0);
    expect(errors.every((e) => e === 0)).toBe(true);
  });
  it("elige parámetros que siguen una tendencia lineal", () => {
    const { forecast } = forecastSeries([1, 1.5, 2, 2.5, 3, 3.5, 4]);
    expect(forecast[0]).toBeGreaterThan(4);
    // La tendencia amortiguada deja un error pequeño incluso con una recta perfecta.
    expect(fitHolt([1, 1.5, 2, 2.5, 3, 3.5, 4]).sse).toBeLessThan(0.2);
  });
});

describe("pronóstico de ánimo", () => {
  it("con menos de 7 registros no pronostica", () => {
    expect(forecastMood(serie([3, 3, 3, 3, 3, 3]), today)).toBeNull();
  });
  it("cielo despejado con ánimo estable", () => {
    const f = forecastMood(serie([4, 4, 3, 4, 4, 4, 3, 4, 4]), today)!;
    expect(f.dip).toBe(false);
    expect(f.sky).toBe("despejado");
    expect(f.forecast).toHaveLength(3);
    expect(f.lower[2]).toBeLessThanOrEqual(f.forecast[2]);
  });
  it("anticipa una bajada cuando el ánimo viene cayendo", () => {
    const f = forecastMood(serie([5, 5, 4, 4, 4, 3, 3, 3, 2, 2]), today)!;
    expect(f.dip).toBe(true);
    expect(["nubes", "tormenta"]).toContain(f.sky);
    expect(f.trendPerStep).toBeLessThan(0);
  });
  it("ignora registros fuera de las últimas 3 semanas", () => {
    const old = serie(Array.from({ length: 30 }, () => 1)).slice(0, 9);
    expect(forecastMood(old, today)).toBeNull();
  });
});

describe("evaluación con origen móvil", () => {
  it("compara Holt con el último valor y la media de 7 días", () => {
    const trendy = Array.from({ length: 14 }, (_, i) => 1 + i * 0.25);
    const b = backtestForecast([trendy, [3, 3, 3]]);
    expect(b.students).toBe(1);
    expect(b.predictions).toBe(7);
    expect(b.h1.holt.rmse!).toBeLessThan(b.h1.naive.rmse!);
    expect(b.h1.holt.mae!).toBeLessThan(b.h1.mean7.mae!);
    expect(b.h3.holt.mae!).toBeLessThan(b.h3.naive.mae!);
  });
});
