/**
 * "¿Por qué?" de la brújula — capa de Dominio (pura).
 * Para cada indicador que mueve la brújula, una misión concreta del catálogo con la que el
 * estudiante puede actuar hoy. Solo misiones sin nivel, ruta ni arquetipo: siempre disponibles.
 * scaleDistress no lleva misión: lo indicado es conversar con Bienestar Universitario.
 */
import type { FeatureKey } from "@/domain/wellbeing/types";

export const FACTOR_MISSION: Record<FeatureKey, string | null> = {
  moodLow: "gratitude-3",
  moodDecline: "journal-1",
  stressHigh: "breath-4",
  sleepDeficit: "breath-night",
  engagementDrop: "daily-challenge",
  lowAdherence: "daily-challenge",
  socialWithdrawal: "social-message",
  streakBreak: "daily-challenge",
  scaleDistress: null,
  taskSkipRate: "daily-challenge",
  selfcareGap: "breath-box",
  lateCheckin: "meditation-2m",
  scheduleIrregularity: "breath-night",
  responseLatency: "breath-4",
};
