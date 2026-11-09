// Relación entre misiones y zonas del Mundo. Las misiones AR tienen una zona propia para que
// la cámara se ambiente con ella; el resto se agrupa por categoría, como antes.
import { baseCategory, type Mission, type MissionType } from "@/domain/gamification/missionsData";
import type { ZoneKey } from "@/domain/world/dioramas";

// Zona de cada tipo de misión AR (las variantes comparten tipo: p. ej. "Altar de gratitud" es ar-focus).
export const AR_ZONE_BY_TYPE: Partial<Record<MissionType, ZoneKey>> = {
  "ar-aura": "valle",    // respirar con calma en la campiña
  "ar-energy": "bosque", // cargar energía entre los árboles
  "ar-focus": "reino",   // enfoque y gratitud junto al castillo
  "ar-walk": "montana",  // caminatas que fortalecen
};

export interface ZoneCategories { key: ZoneKey; categories: readonly string[] }

// Zona en la que se ambienta una misión AR (null si no es AR).
export function arZoneFor(mission: Pick<Mission, "type" | "isAR">): ZoneKey | null {
  return mission.isAR ? AR_ZONE_BY_TYPE[mission.type] ?? null : null;
}

// ¿La misión se muestra en la zona? AR: por su zona asignada; resto: por categoría.
export function missionBelongsToZone(mission: Pick<Mission, "type" | "isAR" | "category">, zone: ZoneCategories): boolean {
  const arZone = arZoneFor(mission);
  if (arZone) return arZone === zone.key;
  return zone.categories.includes(baseCategory(mission));
}

// "Tu siguiente paso": una misión de la zona desbloqueada con menos progreso que el usuario
// todavía no hizo hoy y que su nivel permite. Si esa zona no tiene, se busca en las demás.
// Dentro de la zona se prefiere una misión afín al arquetipo (isPreferred), si la hay.
export function nextStepMission(
  zones: (ZoneCategories & { unlocked: boolean; progress: number })[],
  missions: Mission[],
  completedToday: ReadonlySet<string>,
  level: number,
  isPreferred: (m: Mission) => boolean = () => false,
): { mission: Mission; zone: ZoneKey } | null {
  const available = (m: Mission) => !completedToday.has(m.id) && (!m.requiredLevel || level >= m.requiredLevel);
  const ordered = zones.filter((z) => z.unlocked).sort((a, b) => a.progress - b.progress);
  for (const zone of ordered) {
    const candidates = missions.filter((m) => available(m) && missionBelongsToZone(m, zone));
    const mission = candidates.find(isPreferred) ?? candidates[0];
    if (mission) return { mission, zone: zone.key };
  }
  return null;
}
