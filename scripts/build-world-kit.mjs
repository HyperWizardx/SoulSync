// Junta las piezas del KayKit Medieval Hexagon Pack (CC0) que usan los dioramas del Mundo
// en un único GLB (public/models/world-kit.glb): un nodo raíz por pieza, una sola textura.
// Requiere: npm i -D @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 meshoptimizer (solo para regenerarlo).
// Se comprime con cuantización + meshopt; useGLTF de drei trae el decodificador.
// Las UV se cuantizan a 16 bits: la textura es una paleta y con menos precisión el pasto toma el color vecino.
// Origen: https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0 (Assets/gltf).
// Uso: node scripts/build-world-kit.mjs <carpeta_con_los_.gltf> public/models/world-kit.glb
import { NodeIO, getBounds } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptEncoder } from "meshoptimizer";
import { dedup, mergeDocuments, meshopt, prune, quantize, weld, unpartition } from "@gltf-transform/functions";
import { readdirSync, statSync } from "node:fs";

const [, , srcDir, outFile] = process.argv;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const target = await io.read(`${srcDir}/hex_grass.gltf`); // documento base (se renombra abajo)
const root = target.getRoot();
const scene = root.listScenes()[0];
// El documento base ya contiene hex_grass: se agrupa bajo un nodo con su nombre.
const base = target.createNode("hex_grass");
for (const child of scene.listChildren()) { scene.removeChild(child); base.addChild(child); }
scene.addChild(base);

for (const file of readdirSync(srcDir).filter((f) => f.endsWith(".gltf") && f !== "hex_grass.gltf").sort()) {
  const name = file.replace(/\.gltf$/, "");
  const source = await io.read(`${srcDir}/${file}`);
  const map = mergeDocuments(target, source);
  const mergedScene = map.get(source.getRoot().listScenes()[0]);
  const group = target.createNode(name);
  for (const child of mergedScene.listChildren()) { mergedScene.removeChild(child); group.addChild(child); }
  mergedScene.dispose();
  scene.addChild(group);
}
// Medidas antes de cuantizar (referencia para la cuadrícula hexagonal del dominio).
for (const n of scene.listChildren().filter((c) => /^hex_grass$|castle/.test(c.getName()))) {
  const b = getBounds(n);
  console.log(n.getName(), "min", b.min.map((v) => v.toFixed(2)).join(","), "max", b.max.map((v) => v.toFixed(2)).join(","));
}
await target.transform(dedup(), weld(), unpartition(), prune(), quantize({ quantizeTexcoord: 16 }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await io.write(outFile, target);

console.log("world-kit:", Math.round(statSync(outFile).size / 1024), "KB,", scene.listChildren().length, "piezas, texturas:", root.listTextures().length);
