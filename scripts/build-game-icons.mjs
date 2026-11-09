// Genera src/presentation/components/icons/gameIconData.ts con SOLO los íconos de game-icons.net
// que usa el código (CC BY 3.0, crédito en public/models/CREDITS.md y en Perfil).
// Busca `icon: "nombre"`, `icon="nombre"` y `<GameIcon name="nombre"` en src.
// Requiere: npm i -D @iconify-json/game-icons (solo para regenerar).
// Uso: node scripts/build-game-icons.mjs src
import { createRequire } from "node:module";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const set = require("@iconify-json/game-icons/icons.json");
const [, , srcDir] = process.argv;
const used = new Set();
const re = /(?:\bicon\s*[:=]\s*|<GameIcon[^>]*\bname=)["']([a-z0-9-]+)["']/g;

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?)$/.test(f) || f === "gameIconData.ts") continue;
    for (const m of readFileSync(p, "utf8").matchAll(re)) if (set.icons[m[1]]) used.add(m[1]);
  }
}
walk(srcDir);

const names = [...used].sort();
const lines = names.map((n) => `  ${JSON.stringify(n)}: ${JSON.stringify(set.icons[n].body)},`);
const out = `// GENERADO por scripts/build-game-icons.mjs: no editar a mano.
// Íconos de game-icons.net (Lorc, Delapouite y colaboradores), licencia CC BY 3.0.
// Cada valor es el contenido SVG de un ícono de 512 × 512.
export const GAME_ICON_SIZE = 512;
export const GAME_ICONS: Record<string, string> = {
${lines.join("\n")}
};
`;
writeFileSync(join(srcDir, "presentation/components/icons/gameIconData.ts"), out);
console.log("íconos:", names.length, "· KB:", Math.round(out.length / 1024));
