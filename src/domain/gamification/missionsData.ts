import type { MissionReward, TaskCategoryName } from "@/domain/gamification/rewards";

export type MissionType =
  | "breathing"
  | "journal"
  | "timer"
  | "gratitude"
  | "quiz"
  | "ar-aura"
  | "ar-energy"
  | "ar-focus"
  | "meditation"
  | "daily-challenge"
  | "ar-walk"
  | "social";


export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  desc: string;
  icon: string; // ícono de game-icons.net (ver GameIcon)
  rarity: "Común" | "Raro" | "Épica" | "Legendaria";
  reward: MissionReward;
  durationSec?: number;
  requiredLevel?: number;
  isAR?: boolean;
  /** Categoría propia cuando no coincide con la de su tipo (p. ej. un temporizador de autocuidado). */
  category?: TaskCategoryName;
}

export const MISSIONS: Mission[] = [
  { id: "breath-4", type: "breathing", title: "Respiración guiada", desc: "4 ciclos de respiración consciente", icon: "meditation", rarity: "Común", reward: { xp: 50, coins: 15, stats: { bienestar: 4, energia: 3 }, attributes: { mindfulness: 3, resiliencia: 1 } } },
  { id: "journal-1", type: "journal", title: "Diario emocional", desc: "Escribe cómo te sientes hoy", icon: "notebook", rarity: "Común", reward: { xp: 40, coins: 10, stats: { claridad: 5, bienestar: 2 }, attributes: { autoconocimiento: 4, empatia: 2 } } },
  { id: "walk-30", type: "timer", title: "Caminata consciente", desc: "30 segundos de pausa activa (demo)", icon: "walk", rarity: "Raro", durationSec: 30, reward: { xp: 70, coins: 25, stats: { energia: 6, bienestar: 4 }, attributes: { mindfulness: 2, resiliencia: 2 } } },
  { id: "gratitude-3", type: "gratitude", title: "3 Gratitudes", desc: "Anota tres cosas por las que estás agradecido", icon: "sparkles", rarity: "Raro", reward: { xp: 60, coins: 20, gems: 1, stats: { bienestar: 6, claridad: 2 }, attributes: { empatia: 3, autoconocimiento: 2 } } },
  { id: "quiz-mind", type: "quiz", title: "Quiz de sabiduría", desc: "3 preguntas sobre mindfulness", icon: "brain", rarity: "Épica", reward: { xp: 90, coins: 30, gems: 2, stats: { claridad: 7 }, attributes: { autoconocimiento: 4, creatividad: 2 } } },
  { id: "deep-breath", type: "breathing", title: "Respiración profunda 8 ciclos", desc: "Sesión extendida para nivel avanzado", icon: "lungs", rarity: "Legendaria", requiredLevel: 5, reward: { xp: 150, coins: 60, gems: 3, stats: { bienestar: 10, energia: 5, claridad: 4 }, attributes: { mindfulness: 6, resiliencia: 4 } } },
  { id: "ar-aura", type: "ar-aura", title: "Aura serena (AR)", desc: "Respira al ritmo del avatar en tu cámara", icon: "aura", rarity: "Raro", isAR: true, reward: { xp: 80, coins: 20, stats: { bienestar: 7, energia: 3 }, attributes: { mindfulness: 4 } } },
  { id: "ar-energy", type: "ar-energy", title: "Captura de energía (AR)", desc: "Toca al avatar 10 veces para cargarlo", icon: "lightning-helix", rarity: "Épica", isAR: true, reward: { xp: 100, coins: 35, gems: 1, stats: { energia: 8 }, attributes: { creatividad: 3 } } },
  { id: "ar-focus", type: "ar-focus", title: "Enfoque consciente (AR)", desc: "Mantén al avatar centrado 30 segundos", icon: "archery-target", rarity: "Legendaria", isAR: true, reward: { xp: 130, coins: 40, gems: 2, stats: { claridad: 9, bienestar: 3 }, attributes: { mindfulness: 5, autoconocimiento: 3 } } },
  { id: "meditation-2m", type: "meditation", title: "Meditación guiada", desc: "2 minutos con voz guía y respiración", icon: "meditation", rarity: "Épica", durationSec: 120, reward: { xp: 110, coins: 35, gems: 1, stats: { bienestar: 8, claridad: 6 }, attributes: { mindfulness: 5, autoconocimiento: 3 } } },
  { id: "daily-challenge", type: "daily-challenge", title: "Reto del día", desc: "Una micro-misión sorpresa cada día", icon: "present", rarity: "Raro", reward: { xp: 65, coins: 20, stats: { bienestar: 4, energia: 2 }, attributes: { creatividad: 3, conexionSocial: 2 } } },
  { id: "ar-walk", type: "ar-walk", title: "Caminata consciente AR", desc: "Camina 30 pasos. Tu avatar crece contigo.", icon: "boot-prints", rarity: "Épica", isAR: true, reward: { xp: 120, coins: 40, gems: 1, stats: { energia: 8, bienestar: 4 }, attributes: { mindfulness: 4, resiliencia: 3 } } },

  // ——— Autocuidado ———
  { id: "breath-box", type: "breathing", title: "Respiración cuadrada", desc: "6 ciclos 4-4-4-4 para bajar revoluciones", icon: "cube", rarity: "Raro", reward: { xp: 65, coins: 20, stats: { bienestar: 5, claridad: 3 }, attributes: { mindfulness: 4 } } },
  { id: "breath-night", type: "breathing", title: "Respiración para dormir", desc: "Ciclos largos antes de descansar", icon: "moon", rarity: "Raro", reward: { xp: 70, coins: 22, stats: { bienestar: 6, energia: 2 }, attributes: { mindfulness: 3, resiliencia: 2 } } },
  { id: "hydrate", type: "timer", category: "autocuidado", title: "Pausa de hidratación", desc: "20 segundos: bebe agua con calma", icon: "water-drop", rarity: "Común", durationSec: 20, reward: { xp: 30, coins: 10, stats: { energia: 3, bienestar: 2 }, attributes: { resiliencia: 1 } } },
  { id: "screen-break", type: "timer", category: "autocuidado", title: "Descanso de pantalla", desc: "45 s mirando lejos, relaja la vista", icon: "semi-closed-eye", rarity: "Común", durationSec: 45, reward: { xp: 40, coins: 12, stats: { energia: 4, claridad: 2 }, attributes: { mindfulness: 2 } } },
  { id: "meditation-5m", type: "meditation", title: "Meditación profunda", desc: "5 minutos de silencio guiado", icon: "lotus", rarity: "Legendaria", durationSec: 300, requiredLevel: 4, reward: { xp: 180, coins: 65, gems: 3, stats: { bienestar: 12, claridad: 8 }, attributes: { mindfulness: 7, autoconocimiento: 4 } } },
  { id: "body-scan", type: "meditation", title: "Escaneo corporal", desc: "90 s recorriendo tu cuerpo con atención", icon: "heart-organ", rarity: "Épica", durationSec: 90, reward: { xp: 95, coins: 30, stats: { bienestar: 7, claridad: 4 }, attributes: { mindfulness: 4, autoconocimiento: 2 } } },
  { id: "self-care-ritual", type: "timer", category: "autocuidado", title: "Ritual de autocuidado", desc: "60 s para algo que te cuide (té, ducha, música)", icon: "bathtub", rarity: "Raro", durationSec: 60, reward: { xp: 70, coins: 25, stats: { bienestar: 6 }, attributes: { autoconocimiento: 2, resiliencia: 2 } } },

  // ——— Reflexión ———
  { id: "journal-worry", type: "journal", title: "Descarga de preocupaciones", desc: "Escribe lo que te pesa y suéltalo", icon: "raining", rarity: "Raro", reward: { xp: 65, coins: 20, stats: { claridad: 6, bienestar: 3 }, attributes: { autoconocimiento: 4, resiliencia: 2 } } },
  { id: "journal-win", type: "journal", title: "Victoria del día", desc: "Registra un logro, por pequeño que sea", icon: "medal", rarity: "Común", reward: { xp: 45, coins: 15, stats: { bienestar: 4, claridad: 3 }, attributes: { autoconocimiento: 3 } } },
  { id: "journal-future", type: "journal", title: "Carta a tu yo futuro", desc: "Escríbete un mensaje para dentro de un mes", icon: "envelope", rarity: "Épica", requiredLevel: 3, reward: { xp: 100, coins: 32, gems: 1, stats: { claridad: 8, bienestar: 3 }, attributes: { autoconocimiento: 5, creatividad: 3 } } },
  { id: "gratitude-people", type: "gratitude", title: "Gratitud por personas", desc: "Tres personas que te sumaron esta semana", icon: "hearts", rarity: "Raro", reward: { xp: 65, coins: 22, stats: { bienestar: 6 }, attributes: { empatia: 4, conexionSocial: 2 } } },
  { id: "gratitude-self", type: "gratitude", title: "Gratitud contigo", desc: "Tres cosas que agradeces de ti mismo", icon: "star-swirl", rarity: "Épica", reward: { xp: 90, coins: 28, gems: 1, stats: { bienestar: 7, claridad: 3 }, attributes: { autoconocimiento: 4, resiliencia: 2 } } },
  { id: "reframe", type: "journal", title: "Reencuadre cognitivo", desc: "Toma un pensamiento negativo y reescríbelo", icon: "cycle", rarity: "Épica", requiredLevel: 3, reward: { xp: 105, coins: 34, gems: 1, stats: { claridad: 8, bienestar: 4 }, attributes: { resiliencia: 5, autoconocimiento: 3 } } },

  // ——— Cognitivo ———
  { id: "quiz-emotions", type: "quiz", title: "Quiz de emociones", desc: "Reconoce y nombra lo que sientes", icon: "drama-masks", rarity: "Raro", reward: { xp: 70, coins: 24, stats: { claridad: 6 }, attributes: { autoconocimiento: 3, empatia: 2 } } },
  { id: "quiz-stress", type: "quiz", title: "Quiz de manejo del estrés", desc: "Estrategias que sí funcionan", icon: "puzzle", rarity: "Épica", reward: { xp: 95, coins: 30, gems: 1, stats: { claridad: 7, bienestar: 2 }, attributes: { resiliencia: 4, autoconocimiento: 2 } } },
  { id: "quiz-sleep", type: "quiz", title: "Quiz de higiene del sueño", desc: "Aprende a descansar mejor", icon: "night-sleep", rarity: "Raro", reward: { xp: 75, coins: 25, stats: { claridad: 5, energia: 3 }, attributes: { autoconocimiento: 3 } } },
  { id: "focus-sprint", type: "timer", category: "cognitivo", title: "Sprint de foco", desc: "2 minutos de atención plena en una sola tarea", icon: "sands-of-time", rarity: "Épica", durationSec: 120, reward: { xp: 100, coins: 30, stats: { claridad: 8, energia: 2 }, attributes: { mindfulness: 4, creatividad: 2 } } },

  // ——— Social ———
  { id: "social-message", type: "social", title: "Mensaje que conecta", desc: "Escribe a alguien que hace tiempo no ves", icon: "chat-bubble", rarity: "Raro", reward: { xp: 70, coins: 24, stats: { bienestar: 5, claridad: 2 }, attributes: { conexionSocial: 5, empatia: 3 } } },
  { id: "social-thanks", type: "social", title: "Agradece en voz alta", desc: "Dile gracias a alguien y anota cómo te sentiste", icon: "prayer", rarity: "Raro", reward: { xp: 75, coins: 25, stats: { bienestar: 6 }, attributes: { empatia: 4, conexionSocial: 4 } } },
  { id: "social-ask-help", type: "social", title: "Pedir apoyo", desc: "Comparte con alguien algo que te cuesta", icon: "shaking-hands", rarity: "Épica", requiredLevel: 3, reward: { xp: 110, coins: 36, gems: 1, stats: { bienestar: 8, claridad: 4 }, attributes: { conexionSocial: 6, resiliencia: 3 } } },
  { id: "social-listen", type: "social", title: "Escucha activa", desc: "Escucha a alguien sin interrumpir y registra la experiencia", icon: "sound-waves", rarity: "Épica", reward: { xp: 95, coins: 30, stats: { bienestar: 5, claridad: 3 }, attributes: { empatia: 6, conexionSocial: 3 } } },

  // ——— Movimiento ———
  { id: "stretch-60", type: "timer", title: "Estiramiento consciente", desc: "60 segundos soltando cuello y hombros", icon: "acrobatic", rarity: "Común", durationSec: 60, reward: { xp: 50, coins: 18, stats: { energia: 5, bienestar: 3 }, attributes: { resiliencia: 2 } } },
  { id: "dance-45", type: "timer", title: "Baila una canción", desc: "45 s de movimiento libre con tu música", icon: "musical-notes", rarity: "Raro", durationSec: 45, reward: { xp: 70, coins: 24, stats: { energia: 7, bienestar: 4 }, attributes: { creatividad: 3 } } },
  { id: "posture-check", type: "timer", title: "Chequeo de postura", desc: "30 s para reajustar tu cuerpo al estudiar", icon: "wooden-chair", rarity: "Común", durationSec: 30, reward: { xp: 35, coins: 12, stats: { energia: 3, claridad: 2 }, attributes: { mindfulness: 2 } } },
  { id: "sunlight", type: "timer", title: "Dosis de luz natural", desc: "90 s al aire libre o junto a la ventana", icon: "sun", rarity: "Raro", durationSec: 90, reward: { xp: 75, coins: 26, stats: { energia: 6, bienestar: 5 }, attributes: { resiliencia: 2, mindfulness: 2 } } },

  // ——— AR ———
  { id: "ar-gratitude", type: "ar-focus", title: "Altar de gratitud (AR)", desc: "Mantén al avatar centrado mientras agradeces", icon: "candle-light", rarity: "Épica", isAR: true, reward: { xp: 110, coins: 34, gems: 1, stats: { bienestar: 7, claridad: 4 }, attributes: { mindfulness: 4, empatia: 2 } } },
  { id: "ar-calm-aura", type: "ar-aura", title: "Aura de calma nocturna (AR)", desc: "Respira lento con tu avatar antes de dormir", icon: "galaxy", rarity: "Épica", isAR: true, reward: { xp: 105, coins: 32, gems: 1, stats: { bienestar: 8 }, attributes: { mindfulness: 5 } } },
  { id: "ar-power", type: "ar-energy", title: "Chispa de ánimo (AR)", desc: "Recarga a tu avatar cuando la energía baje", icon: "battery-pack", rarity: "Raro", isAR: true, reward: { xp: 85, coins: 28, stats: { energia: 7, bienestar: 2 }, attributes: { resiliencia: 3 } } },
  { id: "ar-walk-60", type: "ar-walk", title: "Ruta larga AR", desc: "60 pasos conscientes con tu avatar", icon: "walking-boot", rarity: "Legendaria", isAR: true, requiredLevel: 6, reward: { xp: 170, coins: 60, gems: 2, stats: { energia: 11, bienestar: 6 }, attributes: { mindfulness: 5, resiliencia: 4 } } },
];

export const MISSION_CATEGORY: Record<MissionType, TaskCategoryName> = {
  breathing: "autocuidado", journal: "reflexion", timer: "movimiento", gratitude: "reflexion", quiz: "cognitivo", meditation: "autocuidado", "daily-challenge": "autocuidado", "ar-aura": "ar", "ar-energy": "ar", "ar-focus": "ar", "ar-walk": "movimiento", social: "social",
};


const MISSIONS_BY_ID: Record<string, Mission> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

export function getMissionById(id: string): Mission | undefined { return MISSIONS_BY_ID[id]; }

export function primaryStatOf(mission: Mission | undefined): keyof NonNullable<MissionReward["stats"]> | null {
  const stats = mission?.reward.stats;
  if (!stats) return null;
  const entries = Object.entries(stats) as [keyof NonNullable<MissionReward["stats"]>, number][];
  if (entries.length === 0) return null;
  return entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0][0];
}

/** Categoría temática de la misión: la propia si la declara, si no la de su tipo. */
export function baseCategory(mission: Pick<Mission, "type" | "category">): TaskCategoryName {
  return mission.category ?? MISSION_CATEGORY[mission.type];
}

/** Categoría con la que se registra una misión completada (las AR cuentan como "ar"). */
export function missionCategory(mission: Pick<Mission, "type" | "isAR" | "category">): TaskCategoryName {
  return mission.isAR ? "ar" : baseCategory(mission);
}

type AttributeKey = keyof NonNullable<MissionReward["attributes"]>;

/**
 * Categoría de misión que más hace crecer cada atributo, calculada con el catálogo real
 * (suma de puntos que otorgan sus misiones). Así Perfil explica cómo subirlo sin listas fijas.
 */
export function attributeSourceCategory(attribute: AttributeKey, missions: readonly Mission[] = MISSIONS): TaskCategoryName | null {
  const totals: Partial<Record<TaskCategoryName, number>> = {};
  for (const m of missions) {
    const points = m.reward.attributes?.[attribute] ?? 0;
    if (points > 0) {
      const c = missionCategory(m);
      totals[c] = (totals[c] ?? 0) + points;
    }
  }
  const best = (Object.entries(totals) as [TaskCategoryName, number][]).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}
