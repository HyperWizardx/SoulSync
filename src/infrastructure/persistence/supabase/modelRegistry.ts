/**
 * Registro de modelos en Lovable Cloud — capa de Infraestructura.
 * Lee la brújula activa (con una caché corta por instancia), y registra/activa brújulas
 * entrenadas mediante funciones SQL que exigen el rol de investigación. También pagina
 * lecturas grandes (PostgREST devuelve como máximo 1000 filas por consulta).
 */
import { resolveActiveModel } from "@/domain/wellbeing/trainedLogistic";
import type { WellbeingModel } from "@/domain/wellbeing/types";
import type { Db } from "./gamificationRepository";

const TTL_MS = 60_000;
let cache: { at: number; params: unknown } | null = null;

/** Parámetros de la brújula entrenada activa, o null si rige el criterio experto. */
export async function loadActiveCompassParams(db: Db): Promise<unknown> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.params;
  const { data, error } = await db.from("model_versions").select("version, params")
    .eq("kind", "brujula").eq("active", true).neq("version", "decision-v4").limit(1).maybeSingle();
  const params = error ? null : (data?.params ?? null);
  cache = { at: Date.now(), params };
  return params;
}

/** Modelo con el que se calcula la brújula ahora mismo (entrenado o experto). */
export async function loadActiveModel(db: Db): Promise<WellbeingModel> {
  return resolveActiveModel(await loadActiveCompassParams(db));
}

export function clearCompassCache() {
  cache = null;
}

export async function saveCompassVersion(db: Db, v: { version: string; description: string; params: unknown; metrics: unknown }) {
  const { error } = await db.rpc("save_compass_version", {
    _version: v.version, _description: v.description, _params: v.params as never, _metrics: v.metrics as never,
  });
  if (error) throw new Error(error.message.includes("investigación") ? error.message : "No se pudo registrar el modelo entrenado.");
}

export async function activateCompassVersion(db: Db, version: string) {
  const { error } = await db.rpc("activate_compass", { _version: version });
  clearCompassCache();
  if (error) throw new Error(/investigación|validación|no encontrado/i.test(error.message) ? error.message : "No se pudo activar el modelo.");
}

/** Lee todas las filas de una consulta en páginas de 1000. */
export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, pageSize = 1000, maxRows = 50_000): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error || !data) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}
