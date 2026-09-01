import type { MissionReward, TaskCategoryName } from "@/hooks/useUserStore";

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
  emoji: string;
  rarity: "Común" | "Raro" | "Épica" | "Legendaria";
  reward: MissionReward;
  durationSec?: number;
  requiredLevel?: number;
  isAR?: boolean;
}

export const MISSIONS: Mission[] = [
  { id: "breath-4", type: "breathing", title: "Respiración guiada", desc: "4 ciclos de respiración consciente", emoji: "🧘", rarity: "Común", reward: { xp: 50, coins: 15, stats: { bienestar: 4, energia: 3 }, attributes: { mindfulness: 3, resiliencia: 1 } } },
  { id: "journal-1", type: "journal", title: "Diario emocional", desc: "Escribe cómo te sientes hoy", emoji: "📓", rarity: "Común", reward: { xp: 40, coins: 10, stats: { claridad: 5, bienestar: 2 }, attributes: { autoconocimiento: 4, empatia: 2 } } },
  { id: "walk-30", type: "timer", title: "Caminata consciente", desc: "30 segundos de pausa activa (demo)", emoji: "🚶", rarity: "Raro", durationSec: 30, reward: { xp: 70, coins: 25, stats: { energia: 6, bienestar: 4 }, attributes: { mindfulness: 2, resiliencia: 2 } } },
  { id: "gratitude-3", type: "gratitude", title: "3 Gratitudes", desc: "Anota tres cosas por las que estás agradecido", emoji: "✨", rarity: "Raro", reward: { xp: 60, coins: 20, gems: 1, stats: { bienestar: 6, claridad: 2 }, attributes: { empatia: 3, autoconocimiento: 2 } } },
  { id: "quiz-mind", type: "quiz", title: "Quiz de sabiduría", desc: "3 preguntas sobre mindfulness", emoji: "🧠", rarity: "Épica", reward: { xp: 90, coins: 30, gems: 2, stats: { claridad: 7 }, attributes: { autoconocimiento: 4, creatividad: 2 } } },
  { id: "deep-breath", type: "breathing", title: "Respiración profunda 8 ciclos", desc: "Sesión extendida para nivel avanzado", emoji: "🌬️", rarity: "Legendaria", requiredLevel: 5, reward: { xp: 150, coins: 60, gems: 3, stats: { bienestar: 10, energia: 5, claridad: 4 }, attributes: { mindfulness: 6, resiliencia: 4 } } },
  { id: "ar-aura", type: "ar-aura", title: "Aura serena (AR)", desc: "Respira al ritmo del avatar en tu cámara", emoji: "🌬️", rarity: "Raro", isAR: true, reward: { xp: 80, coins: 20, stats: { bienestar: 7, energia: 3 }, attributes: { mindfulness: 4 } } },
  { id: "ar-energy", type: "ar-energy", title: "Captura de energía (AR)", desc: "Toca al avatar 10 veces para cargarlo", emoji: "⚡", rarity: "Épica", isAR: true, reward: { xp: 100, coins: 35, gems: 1, stats: { energia: 8 }, attributes: { creatividad: 3 } } },
  { id: "ar-focus", type: "ar-focus", title: "Enfoque consciente (AR)", desc: "Mantén al avatar centrado 30 segundos", emoji: "🎯", rarity: "Legendaria", isAR: true, reward: { xp: 130, coins: 40, gems: 2, stats: { claridad: 9, bienestar: 3 }, attributes: { mindfulness: 5, autoconocimiento: 3 } } },
  { id: "meditation-2m", type: "meditation", title: "Meditación guiada", desc: "2 minutos con voz guía y respiración", emoji: "🧘‍♀️", rarity: "Épica", durationSec: 120, reward: { xp: 110, coins: 35, gems: 1, stats: { bienestar: 8, claridad: 6 }, attributes: { mindfulness: 5, autoconocimiento: 3 } } },
  { id: "daily-challenge", type: "daily-challenge", title: "Reto del día", desc: "Una micro-misión sorpresa cada día", emoji: "🎁", rarity: "Raro", reward: { xp: 65, coins: 20, stats: { bienestar: 4, energia: 2 }, attributes: { creatividad: 3, conexionSocial: 2 } } },
  { id: "ar-walk", type: "ar-walk", title: "Caminata consciente AR", desc: "Camina 30 pasos. Tu avatar crece contigo.", emoji: "🚶‍♂️", rarity: "Épica", isAR: true, reward: { xp: 120, coins: 40, gems: 1, stats: { energia: 8, bienestar: 4 }, attributes: { mindfulness: 4, resiliencia: 3 } } },
];

export const MISSION_CATEGORY: Record<MissionType, TaskCategoryName> = {
  breathing: "autocuidado", journal: "reflexion", timer: "movimiento", gratitude: "reflexion", quiz: "cognitivo", meditation: "autocuidado", "daily-challenge": "autocuidado", "ar-aura": "ar", "ar-energy": "ar", "ar-focus": "ar", "ar-walk": "movimiento",
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
