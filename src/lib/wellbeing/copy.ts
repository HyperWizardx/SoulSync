import type { FeatureKey, RiskLevel } from "./types";

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
};

export const RISK_COPY: Record<RiskLevel, { title: string; body: string; tone: string }> = {
  bajo: {
    title: "Señal preventiva: Baja",
    body: "Tus indicadores recientes se mantienen estables. Sigue con tus rutinas de autocuidado.",
    tone: "teal",
  },
  moderado: {
    title: "Señal preventiva: Moderada",
    body: "Algunos indicadores muestran cambios que vale la pena observar esta semana.",
    tone: "gold",
  },
  alto: {
    title: "Señal preventiva: Alta",
    body: "Varios indicadores cambiaron a la vez. Esto no es un diagnóstico, pero es un buen momento para buscar apoyo.",
    tone: "destructive",
  },
  insuficiente: {
    title: "Datos insuficientes",
    body: "Aún no hay suficientes check-ins para generar una señal confiable. Registra tu día unas veces más.",
    tone: "muted",
  },
};

export const DISCLAIMER =
  "Señal preventiva exploratoria generada por un prototipo de investigación. No es un diagnóstico, no evalúa condiciones clínicas y no sustituye la valoración de un profesional de salud mental.";

export const MODEL_NOTE =
  "Baseline transparente (score logístico con pesos definidos por criterio, no entrenados con datos clínicos). La interfaz está preparada para sustituirlo por un modelo entrenado con datos reales del estudio.";

export const SAFETY_MESSAGE =
  "Si te sientes sobrepasado o en riesgo, busca apoyo ahora: contacta a Bienestar Universitario de la Universidad del Sinú, a una persona de confianza o a los servicios de emergencia de tu ciudad. SoulSync complementa, no reemplaza, las herramientas institucionales de acompañamiento.";

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
};
