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
// Wave, Hop y Signature son gestos breves; Signature es el propio de cada arquetipo
// (Caballero alza el escudo, Bárbaro gira el hacha, Pícaro recarga la ballesta, Mago alza la mano).
export type AvatarGesture = "Wave" | "Hop" | "Signature";
export type AvatarAnimation = "Idle" | "Walking_A" | "Cheer" | AvatarGesture;
export const AVATAR_GESTURES: readonly AvatarGesture[] = ["Wave", "Hop", "Signature"];

// Pausa entre gestos en Inicio (ms): ni tan seguido que distraiga ni tan espaciado que no se note.
export const GESTURE_DELAY = { min: 8000, max: 16000 } as const;
export function nextGestureDelay(random: number) {
  const r = Math.max(0, Math.min(1, Number.isFinite(random) ? random : 0.5));
  return Math.round(GESTURE_DELAY.min + r * (GESTURE_DELAY.max - GESTURE_DELAY.min));
}

// Elige el siguiente gesto al azar sin repetir el anterior.
export function pickGesture(random: number, previous?: AvatarGesture | null): AvatarGesture {
  const options = AVATAR_GESTURES.filter((g) => g !== previous);
  const r = Math.max(0, Math.min(0.999999, Number.isFinite(random) ? random : 0));
  return options[Math.floor(r * options.length)];
}

// Elige la animación del personaje; con movimiento reducido solo se usa la pose de reposo.
// Caminar y celebrar tienen prioridad sobre un gesto ocasional.
export function avatarAnimation(state: { walking?: boolean; celebrating?: boolean; gesture?: AvatarGesture | null; reducedMotion?: boolean }): AvatarAnimation {
  if (state.reducedMotion) return "Idle";
  if (state.celebrating) return "Cheer";
  if (state.walking) return "Walking_A";
  return state.gesture ?? "Idle";
}

// Animaciones que se reproducen una sola vez (las demás se repiten).
export function playsOnce(name: AvatarAnimation) {
  return name !== "Idle" && name !== "Walking_A";
}
