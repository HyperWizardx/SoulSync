// Verifica los dioramas del Mundo: casillas válidas, aparición por progreso y piezas presentes en el kit 3D.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DIORAMAS, dioramaModels, hexToWorld, visiblePieces } from "./dioramas";
import { deriveWorldState } from "./world";

const kitNodeNames = () => {
  const glb = readFileSync("public/models/world-kit.glb");
  const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString("utf8"));
  return new Set<string>(json.scenes[0].nodes.map((i: number) => json.nodes[i].name));
};

describe("Dioramas del Mundo", () => {
  it("tiene un diorama por cada zona, incluido el Reino que reemplaza al Mar", () => {
    const world = deriveWorldState({ tasksToday: 0, dailyGoal: 3, tasksLast7: 0, streak: 0, level: 1, checkinToday: false, wellbeingIndex7: null, trend: "estable", riskLevel: "bajo" });
    expect(world.zones.map((z) => z.key)).toEqual(["valle", "bosque", "reino", "montana"]);
    expect(Object.keys(DIORAMAS).sort()).toEqual(["bosque", "montana", "reino", "valle"]);
  });
  it("coloca cada pieza y al personaje sobre una casilla del suelo", () => {
    for (const layout of Object.values(DIORAMAS)) {
      const cells = new Set(layout.ground.map((g) => `${g.q},${g.r}`));
      for (const p of [...layout.pieces, layout.hero]) expect(cells.has(`${p.q},${p.r}`)).toBe(true);
    }
  });
  it("muestra más piezas a medida que avanza la zona y solo lo básico si está bloqueada", () => {
    const layout = DIORAMAS.reino;
    const base = visiblePieces(layout, 0, true).length;
    expect(visiblePieces(layout, 50, true).length).toBeGreaterThan(base);
    expect(visiblePieces(layout, 100, true)).toHaveLength(layout.pieces.length);
    expect(visiblePieces(layout, 100, false)).toHaveLength(base);
  });
  it("ubica las casillas vecinas a 2 unidades del centro", () => {
    for (const c of [{ q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 }]) {
      const { x, z } = hexToWorld(c);
      expect(Math.hypot(x, z)).toBeCloseTo(2, 5);
    }
  });
  it("usa solo piezas incluidas en world-kit.glb", () => {
    const names = kitNodeNames();
    expect(dioramaModels().filter((m) => !names.has(m))).toEqual([]);
  });
});
