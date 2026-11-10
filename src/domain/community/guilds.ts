/**
 * Gremios: grupos de 3 a 5 estudiantes que superan juntos un reto semanal de misiones.
 * Sin ranking: solo se muestra el progreso colectivo y cuántos héroes han aportado.
 * Reglas puras (códigos, emblemas, reto de la semana, meta y cofre), probadas en guilds.test.ts.
 */
import { weekStart } from '@/domain/wellbeing/activity';
import type { TaskCategoryName } from '@/domain/gamification/rewards';

export const GUILD_MIN = 3;
export const GUILD_MAX = 5;
/** Misiones del reto por cada miembro del gremio. */
export const MISSIONS_PER_MEMBER = 3;
/** Cofre que recibe cada miembro cuando el gremio supera el reto de la semana. */
export const GUILD_CHEST = { xp: 0, coins: 60, gems: 2 } as const;

/** Alfabeto de códigos sin caracteres ambiguos (sin I, L, O, 0 ni 1). */
export const GUILD_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const GUILD_CODE_LENGTH = 6;

/** Normaliza lo que escribe el estudiante: mayúsculas, sin espacios ni guiones. */
export function normalizeGuildCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}
export function isValidGuildCode(code: string): boolean {
  return code.length === GUILD_CODE_LENGTH && [...code].every((ch) => GUILD_CODE_ALPHABET.includes(ch));
}

/** Nombre del gremio: 3 a 30 caracteres de letras, números, espacios y signos básicos. */
export function cleanGuildName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, ' ');
  if (name.length < 3 || name.length > 30) return null;
  return /^[\p{L}\p{N} '.,!¡¿?-]+$/u.test(name) ? name : null;
}

/** Estandartes disponibles (ícono de game-icons.net). */
export const GUILD_EMBLEMS = [
  { key: 'lobo', label: 'Lobo', icon: 'wolf-head' },
  { key: 'dragon', label: 'Dragón', icon: 'dragon-head' },
  { key: 'leon', label: 'León', icon: 'lion' },
  { key: 'aguila', label: 'Águila', icon: 'eagle-emblem' },
  { key: 'buho', label: 'Búho', icon: 'owl' },
  { key: 'ciervo', label: 'Ciervo', icon: 'stag-head' },
] as const;
export type GuildEmblem = (typeof GUILD_EMBLEMS)[number]['key'];
export const emblemIcon = (key: string) => GUILD_EMBLEMS.find((e) => e.key === key)?.icon ?? 'flying-flag';

export interface WeeklyChallenge {
  category: Exclude<TaskCategoryName, 'ar'>;
  /** Categorías de misión que suman (las AR cuentan como movimiento). */
  counts: TaskCategoryName[];
  title: string;
  description: string;
  icon: string;
}

/** Retos en rotación semanal, uno por área de bienestar. */
export const WEEKLY_CHALLENGES: readonly WeeklyChallenge[] = [
  { category: 'autocuidado', counts: ['autocuidado'], title: 'Fogata del descanso', description: 'Entre todos, completen misiones de autocuidado: respirar, descansar y cuidar el cuerpo.', icon: 'camping-tent' },
  { category: 'movimiento', counts: ['movimiento', 'ar'], title: 'Marcha del gremio', description: 'Muevan el cuerpo juntos: cada misión de movimiento o de realidad aumentada suma pasos a la marcha.', icon: 'walking-boot' },
  { category: 'reflexion', counts: ['reflexion'], title: 'Crónica compartida', description: 'Escriban la crónica de la semana con misiones de reflexión: diario, gratitud y propósito.', icon: 'scroll-quill' },
  { category: 'social', counts: ['social'], title: 'Lazos del gremio', description: 'Fortalezcan sus lazos con misiones sociales: un mensaje, un favor, una charla sincera.', icon: 'shaking-hands' },
  { category: 'cognitivo', counts: ['cognitivo'], title: 'Consejo de sabios', description: 'Afilen la mente con misiones cognitivas: retos, acertijos y enfoque.', icon: 'spell-book' },
];

/** Lunes de referencia para numerar las semanas. */
const EPOCH_MONDAY = Date.parse('2024-01-01T12:00:00Z');

/** Reto de la semana que contiene `today` (el mismo para todos los gremios). */
export function weeklyChallenge(today: string): WeeklyChallenge & { weekStart: string } {
  const start = weekStart(today);
  const index = Math.round((Date.parse(`${start}T12:00:00Z`) - EPOCH_MONDAY) / (7 * 86_400_000));
  const n = WEEKLY_CHALLENGES.length;
  return { ...WEEKLY_CHALLENGES[((index % n) + n) % n], weekStart: start };
}

/** Meta colectiva: 3 misiones por miembro; el reto se activa desde 3 miembros. */
export function challengeTarget(members: number): number {
  return Math.max(GUILD_MIN, members) * MISSIONS_PER_MEMBER;
}

export interface GuildProgress {
  active: boolean;
  target: number;
  done: number;
  percent: number;
  completed: boolean;
  /** Héroes que faltan para activar el reto (0 si ya está activo). */
  missingMembers: number;
}

export function guildProgress(members: number, done: number): GuildProgress {
  const target = challengeTarget(members);
  const active = members >= GUILD_MIN;
  const clamped = Math.max(0, done);
  return {
    active,
    target,
    done: clamped,
    percent: Math.min(100, Math.round((clamped / target) * 100)),
    completed: active && clamped >= target,
    missingMembers: Math.max(0, GUILD_MIN - members),
  };
}

/** ¿Puede este miembro abrir el cofre de la semana? */
export function canClaimChest(progress: GuildProgress, alreadyClaimed: boolean): boolean {
  return progress.completed && !alreadyClaimed;
}
