// Verifica que la función SQL del cofre (migración 0007) replica las reglas del dominio:
// rotación del reto, meta por miembro, mínimo de miembros y recompensa.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GUILD_CHEST, GUILD_MIN, MISSIONS_PER_MEMBER, WEEKLY_CHALLENGES, weeklyChallenge } from "@/domain/community/guilds";

const sql = readFileSync(new URL("../../../../drizzle/migrations/0007_guild_chest_claim.sql", import.meta.url), "utf8");

describe("claim_guild_chest replica el dominio", () => {
  it("misma rotación semanal de categorías", () => {
    const cases = [...sql.matchAll(/WHEN (\d) THEN ARRAY\[([^\]]+)\]/g)].map((m) => ({ i: Number(m[1]), cats: m[2].match(/'([a-z]+)'/g)!.map((c) => c.slice(1, -1)) }));
    const last = /ELSE ARRAY\[([^\]]+)\]/.exec(sql)![1].match(/'([a-z]+)'/g)!.map((c) => c.slice(1, -1));
    const sqlOrder = [...cases.sort((a, b) => a.i - b.i).map((c) => c.cats), last];
    expect(sqlOrder).toEqual(WEEKLY_CHALLENGES.map((c) => [...c.counts]));
    expect(sql).toContain("date '2024-01-01'");
    expect(weeklyChallenge("2024-01-01").category).toBe(WEEKLY_CHALLENGES[0].category);
  });
  it("misma meta, mínimo de miembros y recompensa", () => {
    expect(sql).toContain(`_members < ${GUILD_MIN}`);
    expect(sql).toContain(`_members * ${MISSIONS_PER_MEMBER}`);
    expect(sql).toContain(`_coins constant integer := ${GUILD_CHEST.coins};`);
    expect(sql).toContain(`_gems constant integer := ${GUILD_CHEST.gems};`);
  });
});
