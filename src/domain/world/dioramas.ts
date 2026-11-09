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
  hero: HexCoord;          // casilla donde se para el personaje del usuario
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
      { model: "barrel", q: 0, r: 1, minProgress: 85, offset: [0.55, -0.2], scale: 0.9 },
      { model: "sack", q: 0, r: 1, minProgress: 95, offset: [-0.55, -0.25], scale: 0.9 },
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
      { model: "resource_lumber", q: 0, r: 1, minProgress: 90, offset: [0.55, -0.2], scale: 0.9 },
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
      { model: "flag_blue", q: 0, r: 1, minProgress: 75, offset: [0.6, -0.25] },
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
      { model: "resource_stone", q: 0, r: 1, minProgress: 75, offset: [0.55, -0.2], scale: 0.9 },
      { model: "flag_red", q: 1, r: -1, minProgress: 90, offset: [0.4, 0.3] },
    ],
  },
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
  return [...names].sort();
}
