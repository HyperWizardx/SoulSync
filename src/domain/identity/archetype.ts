// Mapeo visual del avatar según el arquetipo elegido.
// Cada arquetipo tiene su propio personaje medieval KayKit (CC0) en public/models
// (ver avatarMotion.archetypeModelKey);
// aquí se define lo que lo acompaña en la creación del héroe, Inicio, Perfil y misiones AR:
//  - color del aura/glow
//  - exposición (luz) del modelo
//  - ícono, nombre legible, rasgo de bienestar y equipo visible
//  - afinidad: categorías de misión que encajan con su rasgo (se recomiendan primero y dan +20 % de XP)
import type { TaskCategoryName } from "@/domain/gamification/rewards";

export interface ArchetypeStyle {
  name: string;
  icon: string;        // ícono de game-icons.net (ver GameIcon)
  glow: string;        // hsl(...) para MiniAvatar3D
  exposure: number;    // brillo del modelo
  accent: string;      // color tailwind-friendly para anillos/bordes
  trait: string;       // rasgo de bienestar que representa
  gear: string;        // equipo que lleva el personaje 3D
  affinity: readonly TaskCategoryName[]; // categorías de misión afines al arquetipo
}

const STYLES: ArchetypeStyle[] = [
  // 0 - Caballero: rojo/ámbar intenso
  { name: "Caballero",  icon: "broadsword", glow: "hsl(15 85% 55%)",  exposure: 1.25, accent: "hsl(15 85% 55%)",  trait: "Fuerza y resiliencia",     gear: "Espada, escudo y armadura",       affinity: ["movimiento", "autocuidado"] },
  // 1 - Bárbaro: ámbar fogoso
  { name: "Bárbaro",    icon: "battle-axe", glow: "hsl(38 92% 55%)",  exposure: 1.15, accent: "hsl(38 92% 55%)",  trait: "Coraje y energía",         gear: "Hacha a dos manos y piel de oso", affinity: ["social", "ar"] },
  // 2 - Pícaro: turquesa/cyan
  { name: "Pícaro",     icon: "crossbow", glow: "hsl(190 80% 55%)", exposure: 1.20, accent: "hsl(190 80% 55%)", trait: "Curiosidad y aventura",    gear: "Capucha, ballesta y daga",        affinity: ["ar", "cognitivo"] },
  // 3 - Mago: violeta místico
  { name: "Mago",       icon: "pointy-hat", glow: "hsl(265 75% 65%)", exposure: 1.10, accent: "hsl(265 75% 65%)", trait: "Reflexión y conocimiento", gear: "Sombrero y libro de hechizos",    affinity: ["reflexion", "cognitivo"] },
];

const DEFAULT: ArchetypeStyle = {
  name: "Novato",
  icon: "sparkles",
  glow: "hsl(var(--primary))",
  exposure: 1.1,
  accent: "hsl(var(--primary))",
  trait: "",
  gear: "",
  affinity: [],
};

// Arquetipos elegibles en el orden (índice) que se guarda en profiles.archetype.
export const ARCHETYPE_OPTIONS: ReadonlyArray<ArchetypeStyle & { index: number }> = STYLES.map((style, index) => ({ ...style, index }));

export function getArchetypeStyle(archetype: number | null | undefined): ArchetypeStyle {
  if (archetype === null || archetype === undefined) return DEFAULT;
  return STYLES[archetype] ?? DEFAULT;
}

// Añade transparencia a un color hsl(...) del arquetipo (también funciona con hsl(var(--x))).
export function withAlpha(hsl: string, alpha: number): string {
  return hsl.replace(/\)$/, ` / ${alpha})`);
}

/** Bonificación de XP por completar una misión afín al arquetipo (+20 %). */
export const AFFINITY_XP_MULT = 1.2;

/** Nombre legible de cada categoría de misión, para explicar la afinidad. */
export const CATEGORY_LABEL: Record<TaskCategoryName, string> = {
  autocuidado: "Autocuidado",
  reflexion: "Reflexión",
  movimiento: "Movimiento",
  social: "Social",
  cognitivo: "Cognitivo",
  ar: "Realidad aumentada",
};

/** ¿La categoría de misión es afín al arquetipo elegido? (sin arquetipo, ninguna lo es) */
export function isAffine(archetype: number | null | undefined, category: TaskCategoryName): boolean {
  return getArchetypeStyle(archetype).affinity.includes(category);
}
