// Mapeo visual del avatar según el arquetipo elegido.
// Cada arquetipo tiene su propio personaje medieval KayKit (CC0) en public/models
// (ver avatarMotion.archetypeModelKey);
// aquí se define lo que lo acompaña en Inicio, Perfil y misiones AR:
//  - color del aura/glow
//  - exposición (luz) del modelo
//  - emoji y nombre legible

export interface ArchetypeStyle {
  name: string;
  emoji: string;
  glow: string;        // hsl(...) para MiniAvatar3D
  exposure: number;    // brillo del modelo
  accent: string;      // color tailwind-friendly para anillos/bordes
}

const STYLES: ArchetypeStyle[] = [
  // 0 - Caballero: rojo/ámbar intenso
  { name: "Caballero",  emoji: "⚔️", glow: "hsl(15 85% 55%)",  exposure: 1.25, accent: "hsl(15 85% 55%)" },
  // 1 - Bárbaro: ámbar fogoso
  { name: "Bárbaro",    emoji: "🪓", glow: "hsl(38 92% 55%)",  exposure: 1.15, accent: "hsl(38 92% 55%)" },
  // 2 - Pícaro: turquesa/cyan
  { name: "Pícaro",     emoji: "🗡️", glow: "hsl(190 80% 55%)", exposure: 1.20, accent: "hsl(190 80% 55%)" },
  // 3 - Mago: violeta místico
  { name: "Mago",       emoji: "📖", glow: "hsl(265 75% 65%)", exposure: 1.10, accent: "hsl(265 75% 65%)" },
];

const DEFAULT: ArchetypeStyle = {
  name: "Novato",
  emoji: "✨",
  glow: "hsl(var(--primary))",
  exposure: 1.1,
  accent: "hsl(var(--primary))",
};

export function getArchetypeStyle(archetype: number | null | undefined): ArchetypeStyle {
  if (archetype === null || archetype === undefined) return DEFAULT;
  return STYLES[archetype] ?? DEFAULT;
}
