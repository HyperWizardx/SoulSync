// Límites del compañero en pantalla, modelo y animación por arquetipo; independiente de React y del renderizador.
export function avatarPosition(x: number, y: number) {
  return { x: Math.max(20, Math.min(80, x)), y: Math.max(25, Math.min(75, y)) };
}

// 0 Caballero (espada y escudo), 1 Druida (bastón), 2 Pícaro (encapuchado con ballesta), 3 Mago (sombrero y libro).
export function archetypeModelKey(archetype: number | null | undefined) {
  return (["warrior", "healer", "explorer", "sage"] as const)[archetype ?? -1] ?? "explorer";
}

// Nombres de las animaciones incluidas en los modelos KayKit recortados (public/models).
export type AvatarAnimation = "Idle" | "Walking_A" | "Cheer";

// Elige la animación del personaje; con movimiento reducido solo se usa la pose de reposo.
export function avatarAnimation(state: { walking?: boolean; celebrating?: boolean; reducedMotion?: boolean }): AvatarAnimation {
  if (state.reducedMotion) return "Idle";
  if (state.celebrating) return "Cheer";
  return state.walking ? "Walking_A" : "Idle";
}
