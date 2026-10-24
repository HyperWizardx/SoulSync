import { describe, expect, it } from "vitest";
import { computeAura } from "./aura";

describe("aura del avatar", () => {
  it("sin datos queda apagada (nivel 0)", () => {
    expect(computeAura({ checkinDays: 0, selfcareDays: 0, streak: 0 }).level).toBe(0);
  });
  it("4 días de check-in y 4 de autocuidado dan Brillo/Radiante", () => {
    expect(computeAura({ checkinDays: 4, selfcareDays: 4, streak: 2 }).level).toBe(3);
    expect(computeAura({ checkinDays: 3, selfcareDays: 2, streak: 0 }).level).toBe(2);
  });
  it("nunca supera el nivel 4 aunque los datos excedan la semana", () => {
    expect(computeAura({ checkinDays: 30, selfcareDays: 30, streak: 100 }).level).toBe(4);
  });
  it("el mensaje usa los días de cuidado", () => {
    expect(computeAura({ checkinDays: 4, selfcareDays: 1, streak: 0 }).message).toContain("4 días");
  });
});
