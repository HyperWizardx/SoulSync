// Verifica que todo ícono de contenido referido por el dominio exista en el set generado.
import { describe, expect, it } from "vitest";
import { GAME_ICONS } from "./gameIconData";
import { MISSIONS } from "@/domain/gamification/missionsData";
import { ACHIEVEMENTS } from "@/domain/gamification/achievements";
import { STORE_ITEMS } from "@/domain/gamification/items";
import { ARCHETYPE_OPTIONS, getArchetypeStyle } from "@/domain/identity/archetype";
import { zoneInfo } from "@/domain/world/world";

const missing = (names: string[]) => names.filter((n) => !GAME_ICONS[n]);

describe("Íconos de contenido", () => {
  it("existen para misiones, logros y objetos", () => {
    expect(missing(MISSIONS.map((m) => m.icon))).toEqual([]);
    expect(missing(ACHIEVEMENTS.map((a) => a.icon))).toEqual([]);
    expect(missing(STORE_ITEMS.map((i) => i.icon))).toEqual([]);
  });
  it("existen para arquetipos y zonas", () => {
    expect(missing([...ARCHETYPE_OPTIONS.map((a) => a.icon), getArchetypeStyle(null).icon])).toEqual([]);
    expect(missing((["valle", "bosque", "reino", "montana"] as const).map((z) => zoneInfo(z).icon))).toEqual([]);
  });
  it("no quedan emojis en los datos del juego", () => {
    const emoji = /\p{Extended_Pictographic}/u;
    const texts = [...MISSIONS.flatMap((m) => [m.title, m.desc]), ...ACHIEVEMENTS.flatMap((a) => [a.name, a.description]), ...STORE_ITEMS.map((i) => i.name)];
    expect(texts.filter((t) => emoji.test(t))).toEqual([]);
  });
});
