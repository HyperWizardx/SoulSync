// Requiere: npm i -D @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 meshoptimizer (solo para regenerar los modelos).
// Se comprimen con cuantización (UV a 16 bits por la textura de paleta) + meshopt; useGLTF de drei trae el decodificador.
// Origen: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 (Characters/gltf, CC0).
// Ejemplo: node scripts/build-avatars.mjs <carpeta_kaykit> public/models
// Recorta los personajes KayKit (CC0) a lo que usa SoulSync: un set de accesorios
// por arquetipo y solo las animaciones necesarias.
// Uso: node build-avatars.mjs <carpeta_origen> <carpeta_destino>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptEncoder } from "meshoptimizer";
import { prune, dedup, resample, quantize, meshopt } from "@gltf-transform/functions";
import { statSync } from "node:fs";

const [, , srcDir, outDir] = process.argv;
const ANIMS = ["Idle", "Walking_A", "Cheer"];
// Gestos ocasionales en Inicio: saludo y saltito comunes + uno propio de cada arquetipo (se renombran).
const GESTURES = { Interact: "Wave", Jump_Full_Short: "Hop" };
const SPECS = [
  { out: "warrior.glb", src: "Knight.glb", props: ["Knight_Helmet", "Knight_Cape", "1H_Sword", "Badge_Shield"], signature: "Block" },
  // El hacha a dos manos se sostiene mejor con la postura de reposo a dos manos.
  { out: "barbarian.glb", src: "Barbarian.glb", props: ["Barbarian_Hat", "Barbarian_Cape", "2H_Axe"], idle: "2H_Melee_Idle", signature: "2H_Melee_Attack_Spin" },
  { out: "explorer.glb", src: "Rogue_Hooded.glb", props: ["Rogue_Cape", "1H_Crossbow", "Knife_Offhand"], signature: "1H_Ranged_Reload" },
  { out: "sage.glb", src: "Mage.glb", props: ["Mage_Hat", "Mage_Cape", "Spellbook_open"], signature: "Spellcast_Raise" },
];
// Partes del cuerpo que siempre se conservan.
const BODY = /_(ArmLeft|ArmRight|Body|Head|Head_Hooded|LegLeft|LegRight)$/;

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
for (const spec of SPECS) {
  const doc = await io.read(`${srcDir}/${spec.src}`);
  const root = doc.getRoot();
  for (const node of root.listNodes()) {
    if (!node.getMesh()) continue;
    const name = node.getName();
    if (!BODY.test(name) && !spec.props.includes(name)) node.dispose();
  }
  for (const anim of root.listAnimations()) {
    const idle = spec.idle ?? "Idle";
    if (anim.getName() === idle) { anim.setName("Idle"); continue; }
    if (anim.getName() === spec.signature) { anim.setName("Signature"); continue; }
    if (GESTURES[anim.getName()]) { anim.setName(GESTURES[anim.getName()]); continue; }
    if (ANIMS.includes(anim.getName()) && anim.getName() !== "Idle") continue;
    for (const s of anim.listSamplers()) s.dispose();
    for (const c of anim.listChannels()) c.dispose();
    anim.dispose();
  }
  await doc.transform(resample(), dedup(), prune());
  // Algunas muestras de animaciones descartadas quedan huérfanas: se eliminan explícitamente.
  for (const acc of root.listAccessors()) if (acc.listParents().every((p) => p === root)) acc.dispose();
  await doc.transform(prune(), quantize({ quantizeTexcoord: 16 }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  await io.write(`${outDir}/${spec.out}`, doc);
  const kept = root.listNodes().filter((n) => n.getMesh()).map((n) => n.getName());
  console.log(spec.out, Math.round(statSync(`${outDir}/${spec.out}`).size / 1024) + " KB", kept.join(","), root.listAnimations().map((a) => a.getName()).join(","));
}
