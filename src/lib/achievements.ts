// Catálogo de logros (cliente). El servidor también valida en progress.functions.ts.
export interface Achievement {
  code: string;
  name: string;
  emoji: string;
  description: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { code: "first_step", name: "Primer paso", emoji: "🌱", description: "Completa tu primera misión" },
  { code: "streak_3", name: "En racha", emoji: "🔥", description: "3 días seguidos" },
  { code: "streak_7", name: "Llama eterna", emoji: "🔥🔥", description: "7 días seguidos" },
  { code: "streak_30", name: "Mente de acero", emoji: "💎", description: "30 días seguidos" },
  { code: "missions_10", name: "Aprendiz", emoji: "🎯", description: "10 misiones completadas" },
  { code: "missions_50", name: "Maestro", emoji: "🏆", description: "50 misiones completadas" },
  { code: "ar_first", name: "Mundo aumentado", emoji: "📱", description: "Primera misión AR" },
  { code: "ar_5", name: "Realidad ampliada", emoji: "✨", description: "5 misiones AR" },
  { code: "level_5", name: "Despertar", emoji: "⭐", description: "Alcanza nivel 5" },
  { code: "level_10", name: "Iluminado", emoji: "🌟", description: "Alcanza nivel 10" },
  { code: "daily_goal", name: "Meta cumplida", emoji: "✅", description: "Cumple tu meta diaria" },
];

export function getAchievement(code: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.code === code);
}
