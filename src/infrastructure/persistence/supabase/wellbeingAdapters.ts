/**
 * Adaptadores de Lovable Cloud para los puertos del contexto Bienestar — capa de Infraestructura.
 * Implementan las interfaces del dominio; sustituibles sin tocar casos de uso (principio L).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { CONSENT_VERSION } from "@/domain/wellbeing/types";
import type { ConsentRepository, WellbeingEventRepository, WellbeingReader } from "@/domain/wellbeing/ports";
import type { WellbeingDeps } from "@/application/wellbeing/useCases";
import { addTimelineEvent, hasActiveConsent, loadWellbeing, todayISO, type WellbeingPayload } from "./wellbeingRepository";

type Db = SupabaseClient<Database>;

/** Consentimiento persistido en `research_consent`. */
export const supabaseConsentRepository = (db: Db): ConsentRepository => ({
  hasActiveConsent: (userId) => hasActiveConsent(db, userId),
  async accept(userId, wearablesOptIn) {
    await db.from("research_consent").insert({ user_id: userId, consent_version: CONSENT_VERSION, wearables_opt_in: wearablesOptIn });
  },
  async revokeAndPurge(userId) {
    await db.from("research_consent").update({ revoked_at: new Date().toISOString() }).eq("user_id", userId).is("revoked_at", null);
    // Minimización de datos: se elimina todo lo recogido por el módulo.
    for (const t of ["wellbeing_predictions", "wellbeing_checkins", "wellbeing_scales", "timeline_events", "task_events"] as const) {
      await db.from(t).delete().eq("user_id", userId);
    }
  },
});

/** Serie temporal: check-ins, eventos de tarea e historia unificada. */
export const supabaseWellbeingEventRepository = (db: Db): WellbeingEventRepository => ({
  async upsertCheckin(userId, date, i) {
    await db.from("wellbeing_checkins").upsert(
      { user_id: userId, checkin_date: date, mood: i.mood, stress: i.stress, energy: i.energy, social: i.social, sleep_hours: i.sleepHours ?? null, checkin_local_hour: i.localHour ?? null, response_seconds: i.responseSeconds ?? null },
      { onConflict: "user_id,checkin_date" },
    );
  },
  async insertTaskEvent(userId, date, i) {
    await db.from("task_events").insert({
      user_id: userId, mission_id: i.missionId, title: i.title, category: i.category,
      status: i.status, duration_seconds: i.durationSeconds, is_ar: i.isAR, occurred_date: date,
    });
  },
  addTimeline: (userId, entry) => addTimelineEvent(db, userId, entry),
});

/** Lector del estado agregado (ejecuta la inferencia del dominio). */
export const supabaseWellbeingReader = (db: Db): WellbeingReader<WellbeingPayload> => ({
  load: (userId) => loadWellbeing(db, userId),
});

/** Composición de dependencias (composition root) para los casos de uso. */
export const buildWellbeingDeps = (db: Db): WellbeingDeps<WellbeingPayload> => ({
  consent: supabaseConsentRepository(db),
  events: supabaseWellbeingEventRepository(db),
  reader: supabaseWellbeingReader(db),
  today: todayISO,
});
