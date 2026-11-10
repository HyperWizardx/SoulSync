// Pruebas de las reglas de gremios: códigos, nombres, reto semanal, meta y cofre.
import { describe, expect, it } from "vitest";
import {
  GUILD_CODE_ALPHABET, WEEKLY_CHALLENGES, canClaimChest, challengeTarget, cleanGuildName, guildProgress,
  isValidGuildCode, normalizeGuildCode, weeklyChallenge,
} from "./guilds";

describe("códigos y nombres", () => {
  it("normaliza y valida el código", () => {
    expect(normalizeGuildCode(" ab3-k9 x ")).toBe("AB3K9X");
    expect(isValidGuildCode("AB3K9X")).toBe(true);
    expect(isValidGuildCode("AB3K9")).toBe(false);
    expect(isValidGuildCode("AB3K9O")).toBe(false); // la O se confunde con el 0
    expect(GUILD_CODE_ALPHABET).not.toMatch(/[IL01O]/);
  });
  it("limpia el nombre y rechaza los inválidos", () => {
    expect(cleanGuildName("  Los   Lobos del Sinú ")).toBe("Los Lobos del Sinú");
    expect(cleanGuildName("ab")).toBeNull();
    expect(cleanGuildName("<script>")).toBeNull();
    expect(cleanGuildName("x".repeat(31))).toBeNull();
  });
});

describe("reto semanal", () => {
  it("es el mismo toda la semana (lunes a domingo) y rota cada semana", () => {
    const mon = weeklyChallenge("2026-11-09");
    expect(mon.weekStart).toBe("2026-11-09");
    expect(weeklyChallenge("2026-11-15").title).toBe(mon.title);
    expect(weeklyChallenge("2026-11-16").title).not.toBe(mon.title);
  });
  it("recorre todas las áreas en cinco semanas", () => {
    const seen = new Set<string>();
    for (let w = 0; w < WEEKLY_CHALLENGES.length; w++) {
      const d = new Date(Date.UTC(2026, 10, 9 + w * 7)).toISOString().slice(0, 10);
      seen.add(weeklyChallenge(d).category);
    }
    expect(seen.size).toBe(WEEKLY_CHALLENGES.length);
  });
  it("las misiones AR suman en la marcha de movimiento", () => {
    expect(WEEKLY_CHALLENGES.find((c) => c.category === "movimiento")?.counts).toContain("ar");
  });
});

describe("meta y cofre", () => {
  it("3 misiones por miembro, desde 3 miembros", () => {
    expect(challengeTarget(1)).toBe(9);
    expect(challengeTarget(4)).toBe(12);
    expect(challengeTarget(5)).toBe(15);
  });
  it("con menos de 3 miembros el reto no se activa aunque haya misiones", () => {
    const p = guildProgress(2, 20);
    expect(p).toMatchObject({ active: false, completed: false, missingMembers: 1, percent: 100 });
    expect(canClaimChest(p, false)).toBe(false);
  });
  it("el cofre se abre una vez cuando el gremio cumple la meta", () => {
    const p = guildProgress(4, 12);
    expect(p).toMatchObject({ active: true, completed: true, percent: 100 });
    expect(canClaimChest(p, false)).toBe(true);
    expect(canClaimChest(p, true)).toBe(false);
    expect(guildProgress(4, 6).percent).toBe(50);
  });
});
