import { describe, expect, it } from "vitest";
import { safeNext } from "./safeRedirect";

describe("safeNext", () => {
  it("acepta rutas internas con búsqueda y ancla", () => {
    expect(safeNext("/missions")).toBe("/missions");
    expect(safeNext("/missions?mission=respirar#top")).toBe("/missions?mission=respirar#top");
    expect(safeNext("/.lovable/oauth/consent?authorization_id=abc")).toBe("/.lovable/oauth/consent?authorization_id=abc");
  });

  it("rechaza destinos fuera de la app", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "/\\/evil.com", "https://evil.com", "javascript:alert(1)", "evil.com", "/\tevil", "/\nevil", ""]) {
      expect(safeNext(bad), JSON.stringify(bad)).toBeNull();
    }
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext(null)).toBeNull();
    expect(safeNext(`/${"a".repeat(600)}`)).toBeNull();
  });
});
