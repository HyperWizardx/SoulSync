// Límites del compañero en pantalla, independientes de React y del renderizador.
export function avatarPosition(x: number, y: number) {
  return { x: Math.max(20, Math.min(80, x)), y: Math.max(25, Math.min(75, y)) };
}
export function archetypeModelKey(archetype: number | null | undefined) {
  return (["warrior", "healer", "explorer", "sage"] as const)[archetype ?? -1] ?? "explorer";
}