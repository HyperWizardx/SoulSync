import { describe, expect, it } from "vitest";
import { computeEffectBonuses, getItem, STORE_ITEMS } from "@/lib/items";
import {
  ACHIEVEMENTS,
  achievementProgress,
  evaluateAchievements,
  getAchievement,
  type AchievementContext,
} from "@/lib/achievements";

const baseCtx: AchievementContext = {
  missions: 0,
  missionsAR: 0,
  streak: 0,
  level: 1,
  byCategory: {},
  categoriesWith5: 0,
  checkins: 0,
  predictions: 0,
  goalDays: 0,
  zonesUnlocked: 0,
  purchases: 0,
  itemsUsed: 0,
};

describe("efectos de objetos", () => {
  it("sin objetos no altera las recompensas", () => {
    const b = computeEffectBonuses([], []);
    expect(b.xpMult).toBe(1);
    expect(b.coinMult).toBe(1);
    expect(b.hasShield).toBe(false);
    expect(b.attrBonus).toEqual({});
  });

  it("aplica el multiplicador de XP del consumible activo", () => {
    const b = computeEffectBonuses(
      [{ item_key: "elixir_energia", effect: "xp_multiplier", magnitude: 1.5 }],
      [],
    );
    expect(b.xpMult).toBeCloseTo(1.5);
  });

  it("acumula consumible y reliquia equipada", () => {
    const b = computeEffectBonuses(
      [{ item_key: "elixir_energia", effect: "xp_multiplier", magnitude: 1.5 }],
      ["aura_dorada"],
    );
    expect(b.xpMult).toBeCloseTo(1.5 * 1.15);
  });

  it("suma bonus de atributo del objeto correcto", () => {
    const b = computeEffectBonuses(
      [{ item_key: "pocion_calma", effect: "attribute_bonus", magnitude: 3 }],
      ["corona_empatia"],
    );
    expect(b.attrBonus["mindfulness"]).toBe(3);
    expect(b.attrBonus["empatia"]).toBe(3);
  });

  it("detecta el escudo de racha", () => {
    const b = computeEffectBonuses(
      [{ item_key: "escudo_emocional", effect: "streak_shield", magnitude: 1 }],
      [],
    );
    expect(b.hasShield).toBe(true);
  });

  it("ignora reliquias no equipadas y claves desconocidas", () => {
    const b = computeEffectBonuses([{ item_key: "nope", effect: "attribute_bonus", magnitude: 9 }], ["nope"]);
    expect(b.attrBonus).toEqual({});
    expect(b.xpMult).toBe(1);
  });

  it("el catálogo tiene mayoría de consumibles y claves únicas", () => {
    const consumables = STORE_ITEMS.filter((i) => i.kind === "consumable");
    expect(consumables.length).toBeGreaterThan(STORE_ITEMS.length / 2);
    expect(new Set(STORE_ITEMS.map((i) => i.key)).size).toBe(STORE_ITEMS.length);
    expect(getItem("pocion_calma")?.name).toBe("Poción de Calma");
  });
});

describe("logros", () => {
  it("los códigos son únicos", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.code)).size).toBe(ACHIEVEMENTS.length);
  });

  it("no desbloquea nada con progreso cero", () => {
    expect(evaluateAchievements(baseCtx, [])).toHaveLength(0);
  });

  it("desbloquea por misiones reales y no repite lo ya obtenido", () => {
    const ctx = { ...baseCtx, missions: 10 };
    const codes = evaluateAchievements(ctx, []).map((a) => a.code);
    expect(codes).toContain("first_step");
    expect(codes).toContain("missions_10");
    const again = evaluateAchievements(ctx, codes).map((a) => a.code);
    expect(again).toHaveLength(0);
  });

  it("calcula progreso parcial por categoría", () => {
    const ctx = { ...baseCtx, byCategory: { social: 7 } };
    const a = getAchievement("cat_social_10")!;
    const p = achievementProgress(a, ctx);
    expect(p.value).toBe(7);
    expect(p.target).toBe(10);
    expect(p.ratio).toBeCloseTo(0.7);
  });

  it("el progreso nunca supera el objetivo", () => {
    const a = getAchievement("streak_3")!;
    expect(achievementProgress(a, { ...baseCtx, streak: 40 }).ratio).toBe(1);
  });

  it("otorga el logro de equilibrio con 5 de cada categoría", () => {
    const codes = evaluateAchievements({ ...baseCtx, categoriesWith5: 5 }, []).map((a) => a.code);
    expect(codes).toContain("equilibrio");
  });
});
