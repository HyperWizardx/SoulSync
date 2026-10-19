// Pequeño event bus para mostrar feedback global (level up, logros) desde cualquier parte.
type LevelUpEvent = { type: "levelup"; level: number };
type AchievementEvent = { type: "achievement"; code: string };
type FeedbackEvent = LevelUpEvent | AchievementEvent;

type Listener = (e: FeedbackEvent) => void;
const listeners = new Set<Listener>();

export function emitFeedback(e: FeedbackEvent) {
  listeners.forEach((l) => l(e));
}

export function onFeedback(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
