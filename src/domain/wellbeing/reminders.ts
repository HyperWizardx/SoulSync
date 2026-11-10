/**
 * Recordatorio diario: a la hora que elige el estudiante, nunca de noche (solo entre 7:00 y 21:00,
 * y en silencio desde las 22:00), y solo si aún no ha hecho una misión hoy. También genera el
 * evento de calendario (.ics) que avisa cada día aunque la app esté cerrada. Reglas puras.
 */
export const REMINDER_EARLIEST = '07:00';
export const REMINDER_LATEST = '21:00';
export const DEFAULT_REMINDER_TIME = '19:00';
/** Desde esta hora y hasta REMINDER_EARLIEST no se muestra ningún aviso. */
export const QUIET_FROM = '22:00';
const STEP = 30;

export const toMinutes = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};
const fromMinutes = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Horas que se pueden elegir: cada media hora entre 7:00 y 21:00. */
export const REMINDER_SLOTS: readonly string[] = Array.from(
  { length: (toMinutes(REMINDER_LATEST) - toMinutes(REMINDER_EARLIEST)) / STEP + 1 },
  (_, i) => fromMinutes(toMinutes(REMINDER_EARLIEST) + i * STEP),
);

/** Lleva cualquier hora al horario permitido (media hora más cercana, sin madrugadas ni noches). */
export function clampReminderTime(time: string | null | undefined): string {
  const min = toMinutes(time ?? '');
  if (!Number.isFinite(min) || min < 0 || min >= 24 * 60) return DEFAULT_REMINDER_TIME;
  const rounded = Math.round(min / STEP) * STEP;
  return fromMinutes(Math.min(toMinutes(REMINDER_LATEST), Math.max(toMinutes(REMINDER_EARLIEST), rounded)));
}

/** ¿Es hora de silencio (22:00–7:00)? */
export function isQuietHour(minutesOfDay: number): boolean {
  return minutesOfDay >= toMinutes(QUIET_FROM) || minutesOfDay < toMinutes(REMINDER_EARLIEST);
}

export interface NudgeState {
  enabled: boolean;
  time: string;
  /** Minutos transcurridos del día local. */
  nowMinutes: number;
  /** ¿Ya completó al menos una misión hoy? */
  doneToday: boolean;
  /** ¿Pidió "hoy no" o ya se le avisó hoy? */
  dismissedToday: boolean;
}

/** Mostrar el aviso: activado, ya pasó su hora, no es de noche y aún no hay misión hoy. */
export function shouldNudge(s: NudgeState): boolean {
  if (!s.enabled || s.doneToday || s.dismissedToday) return false;
  if (isQuietHour(s.nowMinutes)) return false;
  return s.nowMinutes >= toMinutes(clampReminderTime(s.time));
}

/** Mensajes con el tono de cada arquetipo; rotan cada día. */
const MESSAGES: Record<number | 'default', readonly string[]> = {
  0: ['Tu escudo te espera: una misión corta basta para mantener tu guardia.', 'Un caballero cuida su fuerza: ¿un paseo o un estiramiento hoy?'],
  1: ['Tu grito de guerra se oye mejor acompañado: completa una misión hoy.', 'La tribu te espera: un reto rápido y tu energía vuelve a rugir.'],
  2: ['Hay un mapa sin explorar hoy: una misión rápida y sigues la pista.', 'La curiosidad no descansa: descubre una nueva misión hoy.'],
  3: ['Tu grimorio tiene una página en blanco: escribe la de hoy con una misión.', 'Un mago se detiene a pensar: ¿unos minutos de calma hoy?'],
  default: ['Tu aventura te espera: una misión corta y tu llama sigue encendida.', 'Unos minutos para ti: tu héroe te está esperando.'],
};

export function reminderMessage(archetype: number | null | undefined, dayIndex: number): { title: string; body: string } {
  const list = (archetype !== null && archetype !== undefined && MESSAGES[archetype]) || MESSAGES.default;
  return { title: 'SoulSync · Tu aventura te espera', body: list[((dayIndex % list.length) + list.length) % list.length] };
}

/** Pliega líneas de más de 75 octetos (RFC 5545): continúan con un espacio al inicio. */
function fold(line: string): string {
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const code = ch.codePointAt(0) ?? 0;
    const bytes = code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    if (size + bytes > (out.length ? 74 : 75)) { out.push(current); current = ""; size = 0; }
    current += ch;
    size += bytes;
  }
  out.push(current);
  return out.join('\r\n ');
}

/**
 * Evento diario para el calendario del teléfono (RFC 5545), a la hora local elegida y con alarma.
 * La hora es "flotante" (sin zona): el calendario la entiende en la hora del teléfono.
 */
export function buildReminderIcs(opts: { time: string; startDate: string; url: string; body: string }): string {
  const t = clampReminderTime(opts.time).replace(':', '');
  const d = opts.startDate.replace(/-/g, '');
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SoulSync//Recordatorio diario//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:soulsync-recordatorio-diario@soulsync',
    `DTSTAMP:${stamp}`,
    `DTSTART:${d}T${t}00`,
    'DURATION:PT10M',
    'RRULE:FREQ=DAILY',
    `SUMMARY:${esc('SoulSync: tu aventura te espera')}`,
    `DESCRIPTION:${esc(`${opts.body}\n${opts.url}`)}`,
    `URL:${opts.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc('SoulSync: tu aventura te espera')}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
}
