/**
 * Límite de cobro de una misión — capa de Dominio (pura).
 *
 * En la app cada misión se cumple una vez por día, según el día del teléfono del estudiante.
 * El servidor no conoce esa zona horaria, así que aplica una regla equivalente que nunca bloquea
 * un uso normal: cualquier ventana de 24 h toca como mucho 2 días del calendario, así que una misión
 * diaria se puede cobrar a lo sumo 2 veces en 24 h. Más que eso solo pasa repitiendo la petición
 * a mano, y esa recompensa no se entrega.
 */
export const MAX_CLAIMS_PER_24H = 2;
export const CLAIM_WINDOW_MS = 24 * 3_600_000;

/** Inicio de la ventana que se consulta (ISO), para pedir solo las filas necesarias. */
export const claimWindowStart = (now: number) => new Date(now - CLAIM_WINDOW_MS).toISOString();

/** ¿Se puede cobrar otra vez? `previousCompletedAt` son los completed_at de esa misión. */
export function canClaimMission(previousCompletedAt: readonly string[], now: number): boolean {
  const since = now - CLAIM_WINDOW_MS;
  const recent = previousCompletedAt.filter((t) => {
    const ms = Date.parse(t);
    return Number.isFinite(ms) && ms > since;
  }).length;
  return recent < MAX_CLAIMS_PER_24H;
}

export const ALREADY_CLAIMED_MESSAGE = "Ya cumpliste esta misión hoy. Vuelve mañana por otra recompensa.";
