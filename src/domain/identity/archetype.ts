// Mapeo visual del avatar según el arquetipo elegido.
// Como usamos un único modelo .glb, diferenciamos al personaje mediante:
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
  // 0 - Guerrero: rojo/ámbar intenso
  { name: "Guerrero",   emoji: "⚔️", glow: "hsl(15 85% 55%)",  exposure: 1.25, accent: "hsl(15 85% 55%)" },
  // 1 - Sanador: verde vital
  { name: "Sanador",    emoji: "💚", glow: "hsl(150 70% 55%)", exposure: 1.15, accent: "hsl(150 70% 55%)" },
  // 2 - Explorador: turquesa/cyan
  { name: "Explorador", emoji: "🧭", glow: "hsl(190 80% 55%)", exposure: 1.20, accent: "hsl(190 80% 55%)" },
  // 3 - Sabio: violeta místico
  { name: "Sabio",      emoji: "📖", glow: "hsl(265 75% 65%)", exposure: 1.10, accent: "hsl(265 75% 65%)" },
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
