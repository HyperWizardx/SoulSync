/**
 * Índice de Bienestar WHO-5 (OMS) — capa de Dominio (pura).
 * Cinco afirmaciones sobre las últimas dos semanas, cada una de 0 (nunca) a 5 (todo el tiempo).
 * Puntaje bruto 0–25; ×4 = porcentaje 0–100. Un puntaje bruto < 13 indica bienestar bajo y
 * ≤ 7 sugiere buscar una valoración profesional. Se pide cada 14 días, como define la escala.
 */
export const WHO5_CODE = "WHO5";
export const WHO5_MAX = 25;
/** La escala pregunta por las últimas dos semanas: no se repite antes. */
export const WHO5_INTERVAL_DAYS = 14;

/** Versión en español de las cinco afirmaciones. */
export const WHO5_ITEMS = [
  "Me he sentido alegre y de buen humor.",
  "Me he sentido tranquilo/a y relajado/a.",
  "Me he sentido activo/a y enérgico/a.",
  "Me he despertado fresco/a y descansado/a.",
  "Mi vida cotidiana ha estado llena de cosas que me interesan.",
] as const;

/** Opciones de respuesta, de mayor a menor (valor = puntos). */
export const WHO5_OPTIONS = [
  { value: 5, label: "Todo el tiempo" },
  { value: 4, label: "La mayor parte del tiempo" },
  { value: 3, label: "Más de la mitad del tiempo" },
  { value: 2, label: "Menos de la mitad del tiempo" },
  { value: 1, label: "De vez en cuando" },
  { value: 0, label: "Nunca" },
] as const;

export type Who5Band = "bueno" | "bajo" | "muy_bajo";

/** Suma de las cinco respuestas; null si falta alguna o alguna está fuera de 0–5. */
export function who5Raw(answers: readonly number[]): number | null {
  if (answers.length !== WHO5_ITEMS.length) return null;
  if (answers.some((a) => !Number.isInteger(a) || a < 0 || a > 5)) return null;
  return answers.reduce((s, a) => s + a, 0);
}

/** Porcentaje 0–100 (puntaje bruto × 4). */
export const who5Percent = (raw: number) => Math.round(raw * 4);

/** Franja de interpretación según los puntos de corte de la escala. */
export function who5Band(raw: number): Who5Band {
  if (raw <= 7) return "muy_bajo";
  if (raw < 13) return "bajo";
  return "bueno";
}

/** Mensaje para el estudiante según la franja (tono de la app, sin lenguaje clínico). */
export const WHO5_BAND_COPY: Record<Who5Band, { title: string; body: string }> = {
  bueno: { title: "Tu energía brilla", body: "Estas dos semanas te has sentido bien en general. ¡Sigue cuidando lo que te funciona!" },
  bajo: { title: "Tu llama está tenue", body: "Estas semanas han pesado un poco. Las misiones de autocuidado y hablar con alguien de confianza pueden ayudarte." },
  muy_bajo: { title: "Mereces apoyo", body: "Estas semanas han sido difíciles. Te recomendamos conversar con Bienestar Universitario: no tienes que recorrer esto en soledad." },
};

/** ¿Toca responder? Sí si nunca se respondió o pasaron al menos 14 días desde la última vez. */
export function who5Due(lastAnsweredAt: string | null | undefined, today: string): boolean {
  if (!lastAnsweredAt) return true;
  const days = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastAnsweredAt.slice(0, 10)}T00:00:00Z`)) / 86_400_000;
  return Number.isNaN(days) || days >= WHO5_INTERVAL_DAYS;
}

/** Días que faltan para el próximo pergamino (0 si ya toca). */
export function who5DaysLeft(lastAnsweredAt: string | null | undefined, today: string): number {
  if (!lastAnsweredAt) return 0;
  const days = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastAnsweredAt.slice(0, 10)}T00:00:00Z`)) / 86_400_000;
  return Number.isNaN(days) ? 0 : Math.max(0, Math.ceil(WHO5_INTERVAL_DAYS - days));
}

/** Escalas donde un puntaje alto es BUENO (su malestar se invierte). */
const HIGHER_IS_BETTER = new Set([WHO5_CODE]);

/**
 * Malestar 0–1 de cualquier escala registrada: en escalas de síntomas es raw/max;
 * en WHO-5 (más = mejor) es 1 − raw/max. WHO-5 bruto ≤ 7 → malestar ≥ 0,72.
 */
export function scaleDistress(code: string, raw: number, max: number): number {
  if (!(max > 0)) return 0;
  const ratio = Math.max(0, Math.min(1, raw / max));
  return HIGHER_IS_BETTER.has(code) ? 1 - ratio : ratio;
}

/** Umbral de malestar que activa la regla de seguridad "escala_severa" (= WHO-5 bruto ≤ 7). */
export const SEVERE_SCALE_DISTRESS = 0.72;
