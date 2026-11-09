// Confeti de celebración cargado bajo demanda: canvas-confetti no entra en el paquete inicial
// y se omite si el usuario pidió reducir movimiento.
import type { Options } from "canvas-confetti";
import { effectiveReduceMotion, getPrefs } from "@/shared/devicePrefs";

export function fireConfetti(options: Options) {
  if (typeof window === "undefined") return;
  if (effectiveReduceMotion(getPrefs(), window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)) return;
  void import("canvas-confetti").then((m) => m.default(options)).catch(() => { /* sin confeti */ });
}
