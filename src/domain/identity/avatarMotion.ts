// Límites del compañero en pantalla, modelo y animación por arquetipo; independiente de React y del renderizador.
export function avatarPosition(x: number, y: number) {
  return { x: Math.max(20, Math.min(80, x)), y: Math.max(25, Math.min(75, y)) };
}

// Tamaño del compañero AR elegido por el usuario (botones o pellizco), multiplicado por el de la misión.
export const AVATAR_ZOOM = { min: 0.6, max: 1.8 } as const;
export function avatarZoom(zoom: number, missionScale = 1) {
  const total = zoom * missionScale;
  return Math.max(AVATAR_ZOOM.min, Math.min(AVATAR_ZOOM.max, Number.isFinite(total) ? total : 1));
}

// Orientación del personaje en grados, normalizada a (-180, 180] para girarlo por el camino más corto.
export function avatarFacing(degrees: number) {
  const d = ((degrees % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

// 0 Caballero (espada y escudo), 1 Bárbaro (hacha a dos manos), 2 Pícaro (encapuchado con ballesta), 3 Mago (sombrero y libro).
export function archetypeModelKey(archetype: number | null | undefined) {
  return (["warrior", "barbarian", "explorer", "sage"] as const)[archetype ?? -1] ?? "explorer";
}

// Nombres de las animaciones incluidas en los modelos KayKit recortados (public/models).
export type AvatarAnimation = "Idle" | "Walking_A" | "Cheer";

// Elige la animación del personaje; con movimiento reducido solo se usa la pose de reposo.
export function avatarAnimation(state: { walking?: boolean; celebrating?: boolean; reducedMotion?: boolean }): AvatarAnimation {
  if (state.reducedMotion) return "Idle";
  if (state.celebrating) return "Cheer";
  return state.walking ? "Walking_A" : "Idle";
}
