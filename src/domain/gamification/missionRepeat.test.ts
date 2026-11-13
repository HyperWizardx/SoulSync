import { describe, expect, it } from "vitest";
import { canClaimMission, claimWindowStart, MAX_CLAIMS_PER_24H } from "./missionRepeat";

const NOW = Date.parse("2026-11-13T15:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

describe("canClaimMission", () => {
  it("permite la primera vez", () => {
    expect(canClaimMission([], NOW)).toBe(true);
  });

  it("permite dos días seguidos aunque estén a pocas horas (23:00 y 01:00 locales)", () => {
    expect(canClaimMission([hoursAgo(2)], NOW)).toBe(true);
  });

  it("bloquea la tercera vez dentro de 24 h", () => {
    expect(MAX_CLAIMS_PER_24H).toBe(2);
    expect(canClaimMission([hoursAgo(1), hoursAgo(5)], NOW)).toBe(false);
  });

  it("vuelve a permitir cuando las anteriores salen de la ventana", () => {
    expect(canClaimMission([hoursAgo(25), hoursAgo(30), hoursAgo(3)], NOW)).toBe(true);
  });

  it("ignora fechas inválidas", () => {
    expect(canClaimMission(["no-es-fecha", "", hoursAgo(1)], NOW)).toBe(true);
  });

  it("la consulta pide exactamente las últimas 24 h", () => {
    expect(claimWindowStart(NOW)).toBe("2026-11-12T15:00:00.000Z");
  });
});
