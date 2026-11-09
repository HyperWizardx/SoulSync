// Requiere: npm i -D @gltf-transform/core@4 @gltf-transform/functions@4 (solo para regenerar los modelos).
// Origen: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 (Characters/gltf, CC0).
// Ejemplo: node scripts/build-avatars.mjs <carpeta_kaykit> public/models
// Recorta los personajes KayKit (CC0) a lo que usa SoulSync: un set de accesorios
// por arquetipo y solo las animaciones necesarias.
// Uso: node build-avatars.mjs <carpeta_origen> <carpeta_destino>
import { NodeIO } from "@gltf-transform/core";
import { prune, dedup, resample } from "@gltf-transform/functions";
import { statSync } from "node:fs";

const [, , srcDir, outDir] = process.argv;
const ANIMS = ["Idle", "Walking_A", "Cheer"];
const SPECS = [
  { out: "warrior.glb", src: "Knight.glb", props: ["Knight_Helmet", "Knight_Cape", "1H_Sword", "Badge_Shield"] },
  // El bastón se sostiene mejor con la postura de reposo a dos manos.
  { out: "healer.glb", src: "Mage.glb", props: ["Mage_Cape", "2H_Staff"], idle: "2H_Melee_Idle" },
  { out: "explorer.glb", src: "Rogue_Hooded.glb", props: ["Rogue_Cape", "1H_Crossbow", "Knife_Offhand"] },
  { out: "sage.glb", src: "Mage.glb", props: ["Mage_Hat", "Mage_Cape", "Spellbook_open"] },
];
// Partes del cuerpo que siempre se conservan.
const BODY = /_(ArmLeft|ArmRight|Body|Head|Head_Hooded|LegLeft|LegRight)$/;

const io = new NodeIO();
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
    if (ANIMS.includes(anim.getName()) && anim.getName() !== "Idle") continue;
    for (const s of anim.listSamplers()) s.dispose();
    for (const c of anim.listChannels()) c.dispose();
    anim.dispose();
  }
  await doc.transform(resample(), dedup(), prune());
  // Algunas muestras de animaciones descartadas quedan huérfanas: se eliminan explícitamente.
  for (const acc of root.listAccessors()) if (acc.listParents().every((p) => p === root)) acc.dispose();
  await doc.transform(prune());
  await io.write(`${outDir}/${spec.out}`, doc);
  const kept = root.listNodes().filter((n) => n.getMesh()).map((n) => n.getName());
  console.log(spec.out, Math.round(statSync(`${outDir}/${spec.out}`).size / 1024) + " KB", kept.join(","), root.listAnimations().map((a) => a.getName()).join(","));
}
