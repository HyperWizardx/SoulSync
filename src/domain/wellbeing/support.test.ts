// Verifica cuándo se ofrece el apoyo (protocolo inspirado en LIVE LIFE de la OMS).
import { describe, expect, it } from "vitest";
import { SUPPORT_CONTACTS, supportReasons } from "./support";

describe("Protocolo de apoyo", () => {
  it("no ofrece apoyo si todo está en calma", () => {
    expect(supportReasons({ riskLevel: "bajo", safetyFlags: [], lastScale: { code: "WHO5", raw: 18 } })).toEqual([]);
  });
  it("ofrece apoyo con brújula en alerta, reglas de seguridad o WHO-5 muy bajo", () => {
    expect(supportReasons({ riskLevel: "alto" })).toEqual(["brujula_alerta"]);
    expect(supportReasons({ safetyFlags: ["escala_severa"] })).toEqual(["regla_seguridad"]);
    expect(supportReasons({ lastScale: { code: "WHO5", raw: 6 } })).toEqual(["escala_muy_baja"]);
  });
  it("incluye la línea de emergencias 123", () => {
    expect(SUPPORT_CONTACTS.some((c) => c.href === "tel:123")).toBe(true);
  });
});
