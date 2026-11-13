/**
 * Respuestas de las misiones en Lovable Cloud — capa de Infraestructura.
 * Solo se guardan con el consentimiento vigente; los escritos, además, solo si el estudiante
 * autorizó compartirlos (research_consent.share_writing). Las reglas viven en el dominio.
 */
import { buildStoredResponse, type MissionResponseInput } from "@/domain/gamification/missionResponses";
import { missionCategory, type Mission } from "@/domain/gamification/missionsData";
import { CONSENT_VERSION } from "@/domain/wellbeing/types";
import type { Json } from "@/integrations/supabase/types";
import type { Db } from "./gamificationRepository";
import { todayISO } from "./wellbeingRepository";

/** Consentimiento vigente y si autorizó compartir sus escritos. */
export async function responseConsent(db: Db, userId: string): Promise<{ active: boolean; shareWriting: boolean }> {
  const { data } = await db.from("research_consent").select("consent_version, revoked_at, share_writing")
    .eq("user_id", userId).order("accepted_at", { ascending: false }).limit(1).maybeSingle();
  const active = Boolean(data && !data.revoked_at && data.consent_version === CONSENT_VERSION);
  return { active, shareWriting: active && Boolean(data?.share_writing) };
}

/** Guarda la respuesta de una misión completada. Devuelve false si no correspondía guardarla. */
export async function saveMissionResponse(db: Db, userId: string, mission: Mission, input: MissionResponseInput): Promise<boolean> {
  const consent = await responseConsent(db, userId);
  if (!consent.active) return false;
  const stored = buildStoredResponse(mission, input, consent.shareWriting);
  if (!stored) return false;
  const { error } = await db.from("mission_responses").insert({
    user_id: userId,
    mission_id: mission.id,
    mission_title: mission.title,
    category: missionCategory(mission),
    kind: stored.kind,
    payload: stored as unknown as Json,
    shared_writing: consent.shareWriting,
    completed_date: todayISO(),
  });
  return !error;
}
