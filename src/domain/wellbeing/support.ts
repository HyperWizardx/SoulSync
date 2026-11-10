/**
 * Protocolo de apoyo inspirado en LIVE LIFE (OMS, 2021) — capa de Dominio (pura).
 * Detección temprana: cuándo mostrar el aviso de apoyo, por qué y a quién acudir.
 * La app orienta y acompaña; nunca reemplaza la atención profesional.
 */
import type { RiskLevel, SafetyFlag } from "./types";
import { WHO5_CODE, who5Band } from "./who5";

export type SupportReason = "brujula_alerta" | "regla_seguridad" | "escala_muy_baja";

export interface SupportInput {
  riskLevel?: RiskLevel | null;
  safetyFlags?: readonly SafetyFlag[] | null;
  lastScale?: { code: string; raw: number } | null;
}

/** Motivos por los que conviene ofrecer apoyo ahora (vacío = no hace falta). */
export function supportReasons(input: SupportInput): SupportReason[] {
  const reasons: SupportReason[] = [];
  if ((input.safetyFlags ?? []).length > 0) reasons.push("regla_seguridad");
  if (input.riskLevel === "alto") reasons.push("brujula_alerta");
  if (input.lastScale?.code === WHO5_CODE && who5Band(input.lastScale.raw) === "muy_bajo") reasons.push("escala_muy_baja");
  return reasons;
}

export interface SupportContact {
  id: string;
  name: string;
  detail: string;
  href?: string;        // tel:, mailto: o enlace
  actionLabel?: string;
}

/**
 * Contactos de apoyo. Bienestar Universitario es la vía principal del estudio;
 * el 123 es la línea nacional de emergencias de Colombia.
 */
export const SUPPORT_CONTACTS: readonly SupportContact[] = [
  {
    id: "bienestar",
    name: "Bienestar Universitario · Universidad del Sinú",
    detail: "Orientación psicológica para estudiantes. Acércate a la oficina o pide una cita.",
  },
  {
    id: "emergencias",
    name: "Línea de emergencias 123",
    detail: "Si tú o alguien más está en peligro inmediato.",
    href: "tel:123",
    actionLabel: "Llamar al 123",
  },
];

export const SUPPORT_COPY = {
  title: "No tienes que recorrer esto en soledad",
  body: "Pedir ayuda también es un acto de valentía. Habla con alguien de confianza o con un profesional: estas son tus opciones.",
  bannerTitle: "Tu brújula sugiere pedir apoyo",
  bannerBody: "Hemos notado que estos días han sido difíciles. Aquí tienes a quién acudir.",
  disclaimer: "SoulSync acompaña tu bienestar, pero no reemplaza la atención profesional.",
} as const;
