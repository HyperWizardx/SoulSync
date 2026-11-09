// Verifica los 4 arquetipos elegibles, su orden guardado y los colores con transparencia.
import { describe, expect, it } from "vitest";
import { ARCHETYPE_OPTIONS, getArchetypeStyle, withAlpha } from "./archetype";

describe("Arquetipos", () => {
  it("ofrece los 4 personajes en el orden guardado en el perfil", () => {
    expect(ARCHETYPE_OPTIONS.map((a) => [a.index, a.name])).toEqual([[0, "Caballero"], [1, "Bárbaro"], [2, "Pícaro"], [3, "Mago"]]);
    expect(ARCHETYPE_OPTIONS.every((a) => a.trait && a.gear)).toBe(true);
  });
  it("usa el estilo de novato si aún no hay arquetipo", () => {
    expect(getArchetypeStyle(null).name).toBe("Novato");
  });
  it("añade transparencia a colores hsl", () => {
    expect(withAlpha("hsl(15 85% 55%)", 0.4)).toBe("hsl(15 85% 55% / 0.4)");
    expect(withAlpha("hsl(var(--primary))", 0.2)).toBe("hsl(var(--primary) / 0.2)");
  });
});
