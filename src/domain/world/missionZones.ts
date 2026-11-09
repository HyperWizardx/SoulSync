// Relación entre misiones y zonas del Mundo. Las misiones AR tienen una zona propia para que
// la cámara se ambiente con ella; el resto se agrupa por categoría, como antes.
import { MISSION_CATEGORY, type Mission, type MissionType } from "@/domain/gamification/missionsData";
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
export function missionBelongsToZone(mission: Pick<Mission, "type" | "isAR">, zone: ZoneCategories): boolean {
  const arZone = arZoneFor(mission);
  if (arZone) return arZone === zone.key;
  return zone.categories.includes(MISSION_CATEGORY[mission.type]);
}
