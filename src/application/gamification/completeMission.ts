/**
 * Caso de uso "Completar misión" — capa de Aplicación.
 * Combina las reglas del dominio (XP, racha, atributos, efectos de objetos)
 * y devuelve el nuevo estado a persistir. No toca la base de datos.
 */
import { computeEffectBonuses } from "@/domain/gamification/items";
import { applyDeltas, applyXp, isoDay, nextStreak } from "@/domain/gamification/progression";

export type Stats = { bienestar: number; resiliencia: number; energia: number; claridad: number };
export type Attributes = {
  resiliencia: number; empatia: number; mindfulness: number;
  autoconocimiento: number; conexion_social: number; creatividad: number;
};

/** Estado actual del jugador antes de la misión. */
export interface PlayerState {
  xp: number; level: number; coins: number; gems: number;
  streak: number; lastMissionDate: string | null;
  stats: Stats; attributes: Attributes;
}

/** Recompensa declarada por la misión (validada en la capa de Servicio). */
export interface MissionReward {
  xp: number; coins: number; gems: number;
  stats: Partial<Stats>; attributes: Partial<Attributes>;
}

/** Efecto activo de un objeto (id y usos para poder consumirlo después). */
export interface ActiveEffectRow { id: string; item_key: string; effect: string; magnitude: number; uses_left: number | null }

/** Calcula el resultado completo de completar una misión. */
export function planMissionCompletion(
  state: PlayerState,
  reward: MissionReward,
  effects: ActiveEffectRow[],
  equippedKeys: string[],
  now = Date.now(),
) {
  // Multiplicadores y bonus de objetos (tienda) activos/equipados.
  const { xpMult, coinMult, attrBonus, hasShield } = computeEffectBonuses(effects, equippedKeys);
  const gainedXp = Math.round(reward.xp * xpMult);
  const gainedCoins = Math.round(reward.coins * coinMult);
  const boosted = xpMult > 1 || coinMult > 1 || Object.keys(attrBonus).length > 0;

  const today = isoDay(now);
  const { xp, level, leveledUp } = applyXp(state.xp, state.level, gainedXp);
  const { streak, shieldUsed } = nextStreak({
    last: state.lastMissionDate, today, yesterday: isoDay(now, -1), streak: state.streak, hasShield,
  });

  // Los efectos por uso se consumen; el escudo solo si realmente salvó la racha.
  const effectsToConsume = effects.filter(
    (e) => e.uses_left !== null && (shieldUsed || e.effect !== "streak_shield"),
  );

  return {
    today, gainedXp, gainedCoins, boosted, leveledUp, shieldUsed, effectsToConsume,
    profile: { xp, level, streak, coins: state.coins + gainedCoins, gems: state.gems + reward.gems, last_mission_date: today },
    stats: applyDeltas(state.stats, reward.stats),
    attributes: applyDeltas(state.attributes, reward.attributes, attrBonus),
  };
}
