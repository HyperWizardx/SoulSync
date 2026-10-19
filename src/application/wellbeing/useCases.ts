/**
 * Casos de uso del contexto Bienestar — capa de Aplicación.
 * Orquestan reglas del dominio a través de puertos; no conocen la base de datos
 * (por eso se prueban con repositorios simulados). Principio S: un caso por acción.
 */
import type {
  CheckinInput,
  ConsentRepository,
  TaskEventInput,
  WellbeingEventRepository,
  WellbeingReader,
} from "@/domain/wellbeing/ports";

/** Dependencias inyectadas por la capa de Servicio. */
export interface WellbeingDeps<P> {
  consent: ConsentRepository;
  events: WellbeingEventRepository;
  reader: WellbeingReader<P>;
  /** Reloj inyectable: fecha ISO (YYYY-MM-DD) de hoy. */
  today: () => string;
}

/** Error de regla de negocio: no se registra bienestar sin consentimiento. */
export class ConsentRequiredError extends Error {
  constructor() {
    super("Consentimiento requerido antes de registrar check-ins.");
  }
}

/** Acepta o revoca el consentimiento; al revocar se purgan los datos. */
export async function updateConsent<P>(
  deps: WellbeingDeps<P>,
  userId: string,
  accepted: boolean,
  wearablesOptIn = false,
): Promise<P> {
  if (accepted) await deps.consent.accept(userId, wearablesOptIn);
  else await deps.consent.revokeAndPurge(userId);
  return deps.reader.load(userId);
}

/** Registra el check-in del día y su entrada en la historia unificada. */
export async function registerCheckin<P>(deps: WellbeingDeps<P>, userId: string, input: CheckinInput): Promise<P> {
  if (!(await deps.consent.hasActiveConsent(userId))) throw new ConsentRequiredError();
  await deps.events.upsertCheckin(userId, deps.today(), input);
  await deps.events.addTimeline(userId, {
    kind: "checkin",
    title: "Check-in diario registrado",
    detail: `Ánimo ${input.mood}/5 · Estrés ${input.stress}/5 · Energía ${input.energy}/5`,
    payload: { mood: input.mood, stress: input.stress, energy: input.energy, social: input.social },
  });
  return deps.reader.load(userId);
}

/**
 * Registra un evento de tarea. Sin consentimiento NO se graba telemetría,
 * pero el flujo de la app continúa (devuelve el estado igualmente).
 */
export async function recordTaskEvent<P>(deps: WellbeingDeps<P>, userId: string, input: TaskEventInput): Promise<P> {
  if (await deps.consent.hasActiveConsent(userId)) {
    await deps.events.insertTaskEvent(userId, deps.today(), input);
    if (input.status === "skipped") {
      await deps.events.addTimeline(userId, {
        kind: "task_skipped",
        title: `Tarea omitida: ${input.title}`,
        detail: `Categoría: ${input.category}`,
        payload: { missionId: input.missionId, category: input.category },
      });
    }
  }
  return deps.reader.load(userId);
}
