// Catálogo de logros (compartido cliente/servidor).
// El servidor evalúa el progreso real y otorga la recompensa una sola vez.
export type Rarity = "comun" | "raro" | "epico" | "legendario";

export interface AchievementContext {
  missions: number;
  missionsAR: number;
  streak: number;
  level: number;
  byCategory: Record<string, number>;
  categoriesWith5: number;
  checkins: number;
  predictions: number;
  goalDays: number;
  zonesUnlocked: number;
  purchases: number;
  itemsUsed: number;
}

export interface Achievement {
  code: string;
  name: string;
  icon: string; // ícono de game-icons.net (ver GameIcon)
  description: string;
  rarity: Rarity;
  group: "constancia" | "volumen" | "categorias" | "ar" | "nivel" | "bienestar" | "mundo" | "tienda";
  target: number;
  metric: (c: AchievementContext) => number;
}

export const REWARD_BY_RARITY: Record<Rarity, { xp: number; coins: number; gems: number }> = {
  comun: { xp: 25, coins: 30, gems: 0 },
  raro: { xp: 60, coins: 80, gems: 1 },
  epico: { xp: 140, coins: 160, gems: 2 },
  legendario: { xp: 300, coins: 350, gems: 5 },
};

export const RARITY_LABEL: Record<Rarity, string> = {
  comun: "Común",
  raro: "Raro",
  epico: "Épico",
  legendario: "Legendario",
};

export const RARITY_CLASSES: Record<Rarity, { badge: string; border: string; glow: string }> = {
  comun: { badge: "bg-secondary text-muted-foreground", border: "border-border", glow: "" },
  raro: { badge: "bg-soul-teal/20 text-soul-teal", border: "border-soul-teal/50", glow: "shadow-[0_0_16px_-6px_var(--color-soul-teal)]" },
  epico: { badge: "bg-primary/20 text-primary", border: "border-primary/50", glow: "shadow-[0_0_20px_-6px_var(--color-primary)]" },
  legendario: { badge: "bg-soul-gold/20 text-soul-gold", border: "border-soul-gold/60", glow: "shadow-[0_0_24px_-6px_var(--color-soul-gold)]" },
};

/** Secciones de la pantalla Logros, en el orden en que se muestran. */
export const ACHIEVEMENT_GROUPS: { key: Achievement["group"]; label: string }[] = [
  { key: "constancia", label: "Constancia" },
  { key: "volumen", label: "Misiones completadas" },
  { key: "categorias", label: "Categorías de misión" },
  { key: "ar", label: "Realidad aumentada" },
  { key: "nivel", label: "Nivel" },
  { key: "bienestar", label: "Bienestar" },
  { key: "mundo", label: "Mundo" },
  { key: "tienda", label: "Tienda" },
];

const cat = (name: string) => (c: AchievementContext) => c.byCategory[name] ?? 0;

export const ACHIEVEMENTS: Achievement[] = [
  // Constancia
  { code: "first_step", name: "Primer paso", icon: "sprout", description: "Completa tu primera misión", rarity: "comun", group: "constancia", target: 1, metric: (c) => c.missions },
  { code: "streak_3", name: "En racha", icon: "flame", description: "3 días seguidos", rarity: "comun", group: "constancia", target: 3, metric: (c) => c.streak },
  { code: "streak_7", name: "Llama eterna", icon: "fire-ring", description: "7 días seguidos", rarity: "raro", group: "constancia", target: 7, metric: (c) => c.streak },
  { code: "streak_14", name: "Ritual diario", icon: "candle-light", description: "14 días seguidos", rarity: "epico", group: "constancia", target: 14, metric: (c) => c.streak },
  { code: "streak_30", name: "Mente de acero", icon: "cut-diamond", description: "30 días seguidos", rarity: "legendario", group: "constancia", target: 30, metric: (c) => c.streak },
  { code: "streak_60", name: "Inquebrantable", icon: "shield", description: "60 días seguidos", rarity: "legendario", group: "constancia", target: 60, metric: (c) => c.streak },

  // Volumen
  { code: "missions_10", name: "Aprendiz", icon: "archery-target", description: "10 misiones completadas", rarity: "comun", group: "volumen", target: 10, metric: (c) => c.missions },
  { code: "missions_25", name: "Constante", icon: "rank-3", description: "25 misiones completadas", rarity: "raro", group: "volumen", target: 25, metric: (c) => c.missions },
  { code: "missions_50", name: "Maestro", icon: "trophy-cup", description: "50 misiones completadas", rarity: "epico", group: "volumen", target: 50, metric: (c) => c.missions },
  { code: "missions_100", name: "Centurión", icon: "laurel-crown", description: "100 misiones completadas", rarity: "legendario", group: "volumen", target: 100, metric: (c) => c.missions },
  { code: "missions_250", name: "Leyenda viva", icon: "crown", description: "250 misiones completadas", rarity: "legendario", group: "volumen", target: 250, metric: (c) => c.missions },

  // Categorías
  { code: "cat_movimiento_10", name: "Cuerpo en marcha", icon: "run", description: "10 misiones de movimiento", rarity: "raro", group: "categorias", target: 10, metric: cat("movimiento") },
  { code: "cat_reflexion_10", name: "Espejo interior", icon: "scroll-quill", description: "10 misiones de reflexión", rarity: "raro", group: "categorias", target: 10, metric: cat("reflexion") },
  { code: "cat_autocuidado_10", name: "Guardián de ti", icon: "bubbles", description: "10 misiones de autocuidado", rarity: "raro", group: "categorias", target: 10, metric: cat("autocuidado") },
  { code: "cat_social_10", name: "Puente humano", icon: "shaking-hands", description: "10 misiones sociales", rarity: "raro", group: "categorias", target: 10, metric: cat("social") },
  { code: "cat_cognitivo_10", name: "Mente afilada", icon: "brain", description: "10 misiones cognitivas", rarity: "raro", group: "categorias", target: 10, metric: cat("cognitivo") },
  { code: "equilibrio", name: "Equilibrio", icon: "yin-yang", description: "5 misiones de cada categoría", rarity: "legendario", group: "categorias", target: 5, metric: (c) => c.categoriesWith5 },

  // AR
  { code: "ar_first", name: "Mundo aumentado", icon: "smartphone", description: "Primera misión AR", rarity: "comun", group: "ar", target: 1, metric: (c) => c.missionsAR },
  { code: "ar_5", name: "Realidad ampliada", icon: "sparkles", description: "5 misiones AR", rarity: "raro", group: "ar", target: 5, metric: (c) => c.missionsAR },
  { code: "ar_15", name: "Explorador AR", icon: "satellite", description: "15 misiones AR", rarity: "epico", group: "ar", target: 15, metric: (c) => c.missionsAR },
  { code: "ar_30", name: "Arquitecto de mundos", icon: "galaxy", description: "30 misiones AR", rarity: "legendario", group: "ar", target: 30, metric: (c) => c.missionsAR },

  // Nivel
  { code: "level_5", name: "Despertar", icon: "star-formation", description: "Alcanza nivel 5", rarity: "comun", group: "nivel", target: 5, metric: (c) => c.level },
  { code: "level_10", name: "Iluminado", icon: "sun-radiations", description: "Alcanza nivel 10", rarity: "raro", group: "nivel", target: 10, metric: (c) => c.level },
  { code: "level_20", name: "Ascendido", icon: "star-swirl", description: "Alcanza nivel 20", rarity: "epico", group: "nivel", target: 20, metric: (c) => c.level },
  { code: "level_30", name: "Alma plena", icon: "sunbeams", description: "Alcanza nivel 30", rarity: "legendario", group: "nivel", target: 30, metric: (c) => c.level },

  // Bienestar
  { code: "checkin_7", name: "Voz propia", icon: "talk", description: "7 check-ins registrados", rarity: "comun", group: "bienestar", target: 7, metric: (c) => c.checkins },
  { code: "checkin_30", name: "Diario del alma", icon: "book-cover", description: "30 check-ins registrados", rarity: "epico", group: "bienestar", target: 30, metric: (c) => c.checkins },
  { code: "first_prediction", name: "Señal temprana", icon: "telescope", description: "Genera tu primera predicción de bienestar", rarity: "raro", group: "bienestar", target: 1, metric: (c) => c.predictions },
  { code: "daily_goal", name: "Meta cumplida", icon: "check-mark", description: "Cumple tu meta diaria", rarity: "comun", group: "bienestar", target: 1, metric: (c) => c.goalDays },
  { code: "daily_goal_7", name: "Semana perfecta", icon: "calendar", description: "Cumple la meta diaria 7 días", rarity: "epico", group: "bienestar", target: 7, metric: (c) => c.goalDays },

  // Mundo
  { code: "world_2", name: "Explorador", icon: "treasure-map", description: "Desbloquea 2 zonas del mundo", rarity: "comun", group: "mundo", target: 2, metric: (c) => c.zonesUnlocked },
  { code: "world_3", name: "Cartógrafo", icon: "compass", description: "Desbloquea 3 zonas del mundo", rarity: "raro", group: "mundo", target: 3, metric: (c) => c.zonesUnlocked },
  { code: "world_all", name: "Dueño del mundo", icon: "world", description: "Desbloquea todas las zonas", rarity: "legendario", group: "mundo", target: 4, metric: (c) => c.zonesUnlocked },

  // Tienda
  { code: "shop_first", name: "Primera compra", icon: "shopping-cart", description: "Compra tu primer objeto", rarity: "comun", group: "tienda", target: 1, metric: (c) => c.purchases },
  { code: "shop_5", name: "Coleccionista", icon: "knapsack", description: "Consigue 5 objetos", rarity: "raro", group: "tienda", target: 5, metric: (c) => c.purchases },
  { code: "item_used", name: "Alquimista", icon: "fizzing-flask", description: "Usa un objeto en una misión", rarity: "comun", group: "tienda", target: 1, metric: (c) => c.itemsUsed },
];

export function getAchievement(code: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.code === code);
}

export function achievementProgress(a: Achievement, ctx: AchievementContext) {
  const value = Math.max(0, a.metric(ctx));
  return { value: Math.min(value, a.target), target: a.target, ratio: Math.min(1, value / a.target) };
}

export function evaluateAchievements(ctx: AchievementContext, unlocked: string[]): Achievement[] {
  const has = new Set(unlocked);
  return ACHIEVEMENTS.filter((a) => !has.has(a.code) && a.metric(ctx) >= a.target);
}
