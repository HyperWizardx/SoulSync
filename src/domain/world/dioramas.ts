// Dioramas medievales de las zonas del Mundo (piezas del KayKit Medieval Hexagon Pack, CC0,
// reunidas en public/models/world-kit.glb). Datos puros: qué pieza va en cada casilla
// hexagonal y desde qué porcentaje de progreso de la zona aparece.

export type ZoneKey = "valle" | "bosque" | "reino" | "montana";

export interface HexCoord { q: number; r: number }

export interface DioramaPiece extends HexCoord {
  model: string;          // nombre del nodo raíz en world-kit.glb
  minProgress: number;    // 0–100: progreso de la zona desde el que se muestra
  rotation?: number;      // giro en grados sobre el eje vertical
  scale?: number;
  offset?: [number, number]; // desplazamiento (x, z) dentro de la casilla
}

export interface DioramaLayout {
  ground: (HexCoord & { model: string })[];
  pieces: DioramaPiece[];
  hero: HexCoord;          // casilla donde se para el personaje del usuario (queda libre de piezas)
}

// Casilla central y su anillo (7 hexágonos).
const RING: HexCoord[] = [
  { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 }, { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];
const grass = RING.map((c) => ({ ...c, model: "hex_grass" }));
const HERO: HexCoord = { q: 0, r: 1 };

export const DIORAMAS: Record<ZoneKey, DioramaLayout> = {
  // Campiña tranquila que se puebla con las tareas del día.
  valle: {
    ground: grass,
    hero: HERO,
    pieces: [
      { model: "building_windmill_blue", q: 0, r: 0, minProgress: 0, rotation: 30 },
      { model: "trees_A_small", q: -1, r: 0, minProgress: 0 },
      { model: "building_well_blue", q: 1, r: -1, minProgress: 20 },
      { model: "building_grain", q: 1, r: 0, minProgress: 35 },
      { model: "building_home_A_blue", q: 0, r: -1, minProgress: 50, rotation: 180 },
      { model: "tree_single_A", q: -1, r: 1, minProgress: 65 },
      { model: "barrel", q: 1, r: -1, minProgress: 85, offset: [0.55, 0.3], scale: 0.9 },
      { model: "sack", q: -1, r: 1, minProgress: 95, offset: [0.5, -0.35], scale: 0.9 },
    ],
  },
  // Bosque que se espesa con los check-ins.
  bosque: {
    ground: grass,
    hero: HERO,
    pieces: [
      { model: "trees_A_large", q: 0, r: 0, minProgress: 0 },
      { model: "trees_B_medium", q: -1, r: 0, minProgress: 0 },
      { model: "hills_A_trees", q: 0, r: -1, minProgress: 15 },
      { model: "trees_B_large", q: 1, r: -1, minProgress: 30 },
      { model: "tree_single_B", q: 1, r: 0, minProgress: 45 },
      { model: "building_lumbermill_blue", q: -1, r: 1, minProgress: 60, rotation: 60 },
      { model: "tent", q: 1, r: 0, minProgress: 75, offset: [0.35, 0.4], scale: 0.8 },
      { model: "resource_lumber", q: 1, r: 0, minProgress: 90, offset: [-0.45, -0.5], scale: 0.9 },
    ],
  },
  // Reino medieval (antes "Mar de Emociones") que crece con la tendencia de bienestar.
  reino: {
    ground: grass,
    hero: HERO,
    pieces: [
      { model: "building_castle_blue", q: 0, r: 0, minProgress: 0 },
      { model: "building_home_A_blue", q: -1, r: 0, minProgress: 0, rotation: 90 },
      { model: "building_home_B_blue", q: 1, r: -1, minProgress: 15, rotation: 210 },
      { model: "building_market_blue", q: 1, r: 0, minProgress: 30, rotation: 240 },
      { model: "building_church_blue", q: -1, r: 1, minProgress: 45, rotation: 60 },
      { model: "building_tavern_blue", q: 0, r: -1, minProgress: 60, rotation: 180 },
      { model: "flag_blue", q: -1, r: 0, minProgress: 75, offset: [0.6, 0.5] },
      { model: "building_blacksmith_blue", q: 1, r: 0, minProgress: 90, offset: [0.3, 0.45], scale: 0.55, rotation: 270 },
    ],
  },
  // Cordillera que se fortalece con las rachas.
  montana: {
    ground: grass,
    hero: HERO,
    pieces: [
      { model: "mountain_A_grass_trees", q: 0, r: 0, minProgress: 0 },
      { model: "mountain_B", q: 0, r: -1, minProgress: 0 },
      { model: "mountain_C_grass", q: -1, r: 0, minProgress: 15 },
      { model: "rock_single_A", q: 1, r: -1, minProgress: 30 },
      { model: "building_tower_A_blue", q: 1, r: 0, minProgress: 45 },
      { model: "building_mine_blue", q: -1, r: 1, minProgress: 60, rotation: 60 },
      { model: "resource_stone", q: 1, r: -1, minProgress: 75, offset: [-0.45, 0.45], scale: 0.9 },
      { model: "flag_red", q: 1, r: -1, minProgress: 90, offset: [0.4, 0.3] },
    ],
  },
};

// Isla de la zona sobre la que se para el personaje en las misiones AR. Coordenadas en
// unidades de la loseta (2 de ancho); los adornos rodean al personaje sin tocarlo (ver pruebas).
export interface ArPlatformProp { model: string; x: number; z: number; scale: number; rotation?: number }
export const AR_PLATFORMS: Record<ZoneKey, { ground: string; props: ArPlatformProp[] }> = {
  valle: { ground: "hex_grass", props: [
    { model: "building_windmill_blue", x: 0.55, z: -0.45, scale: 0.55, rotation: 30 },
    { model: "trees_A_small", x: -0.55, z: -0.45, scale: 0.45 },
  ] },
  bosque: { ground: "hex_grass", props: [
    { model: "trees_A_large", x: -0.5, z: -0.5, scale: 0.38 },
    { model: "trees_B_medium", x: 0.5, z: -0.5, scale: 0.38 },
    { model: "resource_lumber", x: 0.55, z: 0.4, scale: 0.6 },
  ] },
  reino: { ground: "hex_grass", props: [
    { model: "building_castle_blue", x: 0.5, z: -0.5, scale: 0.3 },
    { model: "building_home_A_blue", x: -0.55, z: -0.4, scale: 0.55, rotation: 90 },
    { model: "flag_blue", x: -0.6, z: 0.35, scale: 0.75 },
  ] },
  montana: { ground: "hex_grass", props: [
    { model: "mountain_A_grass_trees", x: 0.5, z: -0.5, scale: 0.4 },
    { model: "rock_single_A", x: -0.55, z: -0.35, scale: 0.8 },
    { model: "flag_red", x: -0.6, z: 0.35, scale: 0.75 },
  ] },
};

// Radio de la huella de cada pieza (medido de world-kit.glb con getBounds, sin escalar).
export const MODEL_RADIUS: Record<string, number> = {
  hex_grass: 1.15, barrel: 0.1, building_blacksmith_blue: 0.69, building_castle_blue: 1.13, building_church_blue: 0.6,
  building_grain: 1.05, building_home_A_blue: 0.47, building_home_B_blue: 0.56, building_lumbermill_blue: 0.73,
  building_market_blue: 0.9, building_mine_blue: 1.02, building_tavern_blue: 0.7, building_tower_A_blue: 0.58,
  building_well_blue: 0.38, building_windmill_blue: 0.57, flag_blue: 0.24, flag_red: 0.24, hills_A_trees: 0.93,
  mountain_A_grass_trees: 0.96, mountain_B: 0.94, mountain_C_grass: 1.02, resource_lumber: 0.34, resource_stone: 0.21,
  rock_single_A: 0.16, sack: 0.09, tent: 0.26, tree_single_A: 0.3, tree_single_B: 0.36, trees_A_large: 0.99,
  trees_A_small: 0.76, trees_B_large: 0.99, trees_B_medium: 0.97,
};

// Espacio que ocupa el personaje: en el diorama (escala 0.42) y en la isla AR (en unidades de la loseta).
export const HERO_RADIUS = { diorama: 0.3, arPlatform: 0.25 } as const;

// Color de acento de cada zona (marco y degradado sobre la cámara en AR).
export const ZONE_ACCENT: Record<ZoneKey, string> = {
  valle: "hsl(95 55% 50%)",
  bosque: "hsl(150 55% 35%)",
  reino: "hsl(215 70% 55%)",
  montana: "hsl(30 35% 55%)",
};

// Las losetas KayKit son hexágonos "punta arriba" de 2 unidades de ancho (de cara a cara).
const HEX_WIDTH = 2;
export function hexToWorld({ q, r }: HexCoord): { x: number; z: number } {
  return { x: HEX_WIDTH * (q + r / 2), z: HEX_WIDTH * (Math.sqrt(3) / 2) * r };
}

// Piezas visibles: una zona bloqueada solo muestra lo básico; una desbloqueada suma piezas con su progreso.
export function visiblePieces(layout: DioramaLayout, progress: number, unlocked: boolean): DioramaPiece[] {
  const limit = unlocked ? Math.max(0, Math.min(100, progress)) : 0;
  return layout.pieces.filter((p) => p.minProgress <= limit);
}

// Todos los modelos que necesitan los dioramas (deben existir en world-kit.glb).
export function dioramaModels(): string[] {
  const names = new Set<string>();
  for (const layout of Object.values(DIORAMAS)) {
    layout.ground.forEach((g) => names.add(g.model));
    layout.pieces.forEach((p) => names.add(p.model));
  }
  for (const platform of Object.values(AR_PLATFORMS)) {
    names.add(platform.ground);
    platform.props.forEach((p) => names.add(p.model));
  }
  return [...names].sort();
}
