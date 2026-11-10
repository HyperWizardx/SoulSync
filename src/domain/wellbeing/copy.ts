import type { FeatureKey, RiskLevel } from "@/domain/wellbeing/types";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  moodLow: "Ánimo bajo sostenido",
  moodDecline: "Tendencia descendente del ánimo",
  stressHigh: "Estrés autorreportado alto",
  sleepDeficit: "Sueño por debajo de lo habitual",
  engagementDrop: "Caída en el uso de la app",
  lowAdherence: "Baja adherencia a tu meta diaria",
  socialWithdrawal: "Menor conexión social percibida",
  streakBreak: "Días sin actividad",
  scaleDistress: "Resultado de escala de bienestar",
  taskSkipRate: "Tareas diarias omitidas",
  selfcareGap: "Días sin práctica de autocuidado",
  lateCheckin: "Check-ins de madrugada",
  scheduleIrregularity: "Horario irregular de uso",
  responseLatency: "Respuestas más lentas de lo habitual",
};

export const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
  moodLow: "El promedio de tu ánimo en los últimos 7 días está por debajo de tu punto medio.",
  moodDecline: "Tu ánimo promedio bajó respecto a la semana anterior.",
  stressHigh: "Has reportado niveles de estrés elevados en tus check-ins recientes.",
  sleepDeficit: "Las horas de sueño que registraste están por debajo de 7 h en promedio.",
  engagementDrop: "Completaste menos misiones esta semana que la anterior.",
  lowAdherence: "Estás lejos de la meta diaria de misiones que configuraste.",
  socialWithdrawal: "Reportaste sentirte menos conectado con otras personas.",
  streakBreak: "Han pasado varios días desde tu última actividad en la app.",
  scaleDistress: "Proviene de una escala de bienestar que respondiste dentro de la app.",
  taskSkipRate: "Esta semana omitiste una parte de las tareas que iniciaste o tenías asignadas.",
  selfcareGap: "Hubo varios días sin completar tareas de autocuidado, reflexión o movimiento.",
  lateCheckin: "Parte de tus check-ins recientes se hicieron entre las 00:00 y las 05:00, lo que puede indicar trasnocho.",
  scheduleIrregularity: "La hora a la que haces tu check-in varía bastante de un día a otro.",
  responseLatency: "Tus últimos check-ins te tomaron más tiempo que tu propio promedio.",
};

export const RISK_COPY: Record<RiskLevel, { title: string; body: string; tone: string }> = {
  bajo: {
    title: "Brújula en calma",
    body: "Tu camino va firme. Sigue con las rutinas de autocuidado que te están funcionando.",
    tone: "teal",
  },
  moderado: {
    title: "Brújula atenta",
    body: "Algo se movió esta semana. Date un respiro y apóyate en una misión corta de autocuidado.",
    tone: "gold",
  },
  alto: {
    title: "Brújula en alerta",
    body: "Varias cosas cambiaron a la vez. No es un diagnóstico, pero sí un buen momento para pedir apoyo: ningún héroe viaja solo.",
    tone: "destructive",
  },
  insuficiente: {
    title: "Brújula por calibrar",
    body: "Registra tu día unas veces más y tu brújula empezará a orientarte.",
    tone: "muted",
  },
};

export const DISCLAIMER =
  "Tu brújula es orientativa: forma parte de un prototipo de investigación, no es un diagnóstico, no evalúa condiciones clínicas y no reemplaza a un profesional de salud mental.";

/** Versión corta del aviso para tarjetas de resumen (la completa está en Bienestar). */
export const SHORT_DISCLAIMER = "Orientativa, no es un diagnóstico.";

export const MODEL_NOTE =
  "La brújula funciona con reglas transparentes definidas por el equipo de investigación; no se entrenó con datos clínicos.";

export const SAFETY_MESSAGE =
  "No tienes que recorrer esto en soledad. Si sientes que todo te sobrepasa o estás en riesgo, busca apoyo ahora: contacta a Bienestar Universitario de la Universidad del Sinú, a una persona de confianza o a los servicios de emergencia de tu ciudad. SoulSync complementa, no reemplaza, las herramientas institucionales de acompañamiento.";

/** Recomendaciones de autocuidado NO clínicas, ligadas a misiones existentes. */
export const RECOMMENDATIONS: Record<FeatureKey, string> = {
  moodLow: "Prueba la misión de Gratitud: registrar tres cosas concretas ayuda a reencuadrar el día.",
  moodDecline: "El Diario emocional te permite nombrar qué cambió esta semana.",
  stressHigh: "Una sesión de Respiración guiada de 3 minutos puede bajar la activación.",
  sleepDeficit: "Intenta la Meditación guiada antes de dormir y fija una hora de acostarte.",
  engagementDrop: "Vuelve con una micro-misión: el Reto diario toma menos de 2 minutos.",
  lowAdherence: "Ajusta tu meta diaria a un número que puedas sostener; es mejor constante que grande.",
  socialWithdrawal: "Prueba la Caminata consciente y escribe a una persona con quien no hablas hace tiempo.",
  streakBreak: "Retomar cuenta: una sola misión hoy reinicia tu ritmo.",
  scaleDistress: "Conversa tus resultados con Bienestar Universitario; ellos pueden orientarte mejor que la app.",
  taskSkipRate: "Elige una sola tarea corta hoy: completar una es mejor señal que planear cinco.",
  selfcareGap: "Reserva 3 minutos para respiración o gratitud; son las tareas que más sostienen tu ritmo.",
  lateCheckin: "Intenta hacer tu check-in antes de medianoche y prueba la Meditación guiada para cerrar el día.",
  scheduleIrregularity: "Elige una hora fija para tu check-in; una rutina estable ayuda a tu descanso.",
  responseLatency: "Si te cuesta responder, tómate un respiro: una Respiración guiada corta puede despejarte.",
};

/** Títulos antiguos guardados como "Señal bajo · tendencia estable": se muestran con concordancia. */
const LEGACY_LEVEL: Record<string, string> = { bajo: "baja", moderado: "moderada", alto: "alta" };
export function displayTimelineTitle(title: string): string {
  return title.replace(/^Señal (bajo|moderado|alto)\b/, (_, level: string) => `Señal ${LEGACY_LEVEL[level]}`);
}
