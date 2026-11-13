/**
 * Primera vez en SoulSync — capa de Dominio (pura).
 * Pasos del recorrido (cuenta → héroe → primera misión), la primera misión sugerida según el
 * arquetipo (corta, afín, sin requisitos) y el nombre de héroe que ya conocemos del registro.
 */
import { estimateMinutes, missionCategory, visibleMissions, type Mission } from "@/domain/gamification/missionsData";
import { isAffine } from "@/domain/identity/archetype";

export const ONBOARDING_STEPS = [
  { key: "cuenta", label: "Tu cuenta" },
  { key: "heroe", label: "Tu héroe" },
  { key: "mision", label: "Primera misión" },
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]["key"];

/** Tipos de misión ideales para empezar: cortos y guiados, sin cámara. */
const STARTER_TYPES = new Set<Mission["type"]>(["breathing", "timer", "meditation", "quiz", "gratitude"]);

/**
 * Primera misión sugerida: disponible desde el nivel 1, sin ruta previa ni cámara, de 2 minutos o
 * menos. Se prefiere una exclusiva del arquetipo, luego una afín (+20 % de XP) y luego cualquiera.
 * Determinista para cada arquetipo.
 */
export function firstMissionFor(archetype: number | null): Mission | null {
  const pool = visibleMissions(archetype).filter((m) =>
    !m.requiredLevel && !m.path && !m.isAR && STARTER_TYPES.has(m.type) && estimateMinutes(m) <= 2);
  const exclusive = pool.filter((m) => m.archetype !== undefined);
  const affine = pool.filter((m) => isAffine(archetype, missionCategory(m)));
  const ranked = (exclusive.length ? exclusive : affine.length ? affine : pool).slice().sort((a, b) => estimateMinutes(a) - estimateMinutes(b) || a.id.localeCompare(b.id));
  // Entre las más cortas, preferimos la de mayor recompensa para que el primer logro se sienta.
  const shortest = estimateMinutes(ranked[0] ?? ({} as Mission));
  return ranked.filter((m) => estimateMinutes(m) === shortest).sort((a, b) => (b.reward.xp ?? 0) - (a.reward.xp ?? 0) || a.id.localeCompare(b.id))[0] ?? null;
}

/** Nombre de héroe ya conocido (del registro o de Google); vacío si sigue el nombre por defecto. */
export function knownHeroName(profileName: string | null | undefined): string {
  const name = (profileName ?? "").trim();
  return name && name !== "Héroe" ? name.slice(0, 20) : "";
}
