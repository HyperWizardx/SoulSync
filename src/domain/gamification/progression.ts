/**
 * Reglas puras de progresión (XP, nivel, racha, atributos) — capa de Dominio.
 * Sin base de datos ni React: mismas entradas → mismas salidas.
 */

/** XP necesaria para subir un nivel. */
export const XP_PER_LEVEL = 600;

/** Acota un atributo/estadística al rango 0–100. */
export const clampStat = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** Un efecto está activo si le quedan usos y no ha expirado. */
export function isEffectActive(e: { uses_left: number | null; expires_at: string | null }, now = Date.now()) {
  if (e.uses_left !== null && e.uses_left <= 0) return false;
  if (e.expires_at !== null && Date.parse(e.expires_at) < now) return false;
  return true;
}

/** Suma XP y sube los niveles que correspondan. */
export function applyXp(xp: number, level: number, gained: number) {
  let nextXp = xp + gained;
  let nextLevel = level;
  while (nextXp >= XP_PER_LEVEL) {
    nextXp -= XP_PER_LEVEL;
    nextLevel += 1;
  }
  return { xp: nextXp, level: nextLevel, leveledUp: nextLevel > level };
}

/**
 * Calcula la racha tras completar una misión hoy.
 * Ayer → +1; hoy → igual; hueco con Escudo Emocional → +1 (y se gasta); si no → 1.
 */
export function nextStreak(params: {
  last: string | null;
  today: string;
  yesterday: string;
  streak: number;
  hasShield: boolean;
}) {
  const { last, today, yesterday, streak, hasShield } = params;
  if (last === today) return { streak, shieldUsed: false };
  if (last === yesterday) return { streak: streak + 1, shieldUsed: false };
  if (hasShield && streak > 0) return { streak: streak + 1, shieldUsed: true };
  return { streak: 1, shieldUsed: false };
}

/** Aplica deltas (y bonus opcionales) a un mapa de valores 0–100. */
export function applyDeltas<K extends string>(
  base: Record<K, number>,
  deltas: Partial<Record<K, number>>,
  bonus: Partial<Record<string, number>> = {},
): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const k of Object.keys(base) as K[]) {
    out[k] = clampStat(base[k] + (deltas[k] ?? 0) + Math.round(bonus[k] ?? 0));
  }
  return out;
}

/** Fecha ISO (YYYY-MM-DD) desplazada `days` días desde `now`. */
export const isoDay = (now: number, days = 0) => new Date(now + days * 86_400_000).toISOString().slice(0, 10);
