// Acceso a las piezas de public/models/world-kit.glb (KayKit Medieval Hexagon, CC0),
// compartido por los dioramas del Mundo y las islas de las misiones AR.
import { Color, type Mesh, type MeshStandardMaterial, type Object3D } from "three";

export const WORLD_KIT_URL = "/models/world-kit.glb";

// El pasto de la paleta KayKit es verde lima; se tiñe un poco hacia verde para que no se vea amarillo.
const GRASS_TINT = new Color(0.72, 1, 0.74);
function tintGrass(object: Object3D) {
  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    const material = (mesh.material as MeshStandardMaterial).clone();
    material.color.multiply(GRASS_TINT);
    mesh.material = material;
  });
  return object;
}

// Copia independiente de una pieza del kit (null si no existe).
export function cloneKitPiece(kit: Object3D, model: string): Object3D | null {
  const copy = kit.getObjectByName(model)?.clone(true) ?? null;
  return copy && model.startsWith("hex_grass") ? tintGrass(copy) : copy;
}
