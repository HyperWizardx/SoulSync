// Pequeño event bus para mostrar feedback global (level up, logros, recompensas) desde cualquier parte.
type LevelUpEvent = { type: "levelup"; level: number };
type AchievementEvent = { type: "achievement"; code: string };
type RewardEvent = { type: "reward"; xp: number; coins: number; gems: number };
type MissionCompleteEvent = { type: "missionComplete"; title: string; icon: string };
export type FeedbackEvent = LevelUpEvent | AchievementEvent | RewardEvent | MissionCompleteEvent;

/** Cuánto dura el aviso "¡Misión cumplida!" antes de seguir (celebración del avatar, recompensas). */
export const MISSION_BANNER_MS = 1800;
/** Cuánto dura la celebración del personaje en las misiones AR. */
export const AVATAR_CELEBRATION_MS = 1600;

const CHEERS = [
  "¡Así se forja un héroe!",
  "Tu leyenda sigue creciendo.",
  "Un paso más en tu aventura.",
  "Tus tierras celebran contigo.",
  "¡Tu espíritu brilla más fuerte!",
  "Cada hazaña cuenta. ¡Sigue así!",
];

/** Frase motivadora para el aviso de misión cumplida (determinista si se pasa una semilla). */
export function missionCheer(seed = Math.random()): string {
  return CHEERS[Math.floor(seed * CHEERS.length) % CHEERS.length];
}

type Listener = (e: FeedbackEvent) => void;
const listeners = new Set<Listener>();

export function emitFeedback(e: FeedbackEvent) {
  listeners.forEach((l) => l(e));
}

export function onFeedback(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

// Etiquetas de una recompensa en el orden en que se muestran (las que valen 0 no aparecen).
export function rewardChips(e: Pick<RewardEvent, "xp" | "coins" | "gems">): { kind: "xp" | "coins" | "gems"; label: string }[] {
  const chips: { kind: "xp" | "coins" | "gems"; label: string }[] = [];
  if (e.xp > 0) chips.push({ kind: "xp", label: `+${e.xp} XP` });
  if (e.coins > 0) chips.push({ kind: "coins", label: `+${e.coins}` });
  if (e.gems > 0) chips.push({ kind: "gems", label: `+${e.gems}` });
  return chips;
}
