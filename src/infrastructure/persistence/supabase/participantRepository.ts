/**
 * Ficha opcional del participante en Lovable Cloud — capa de Infraestructura.
 * Solo la lee su dueño y el rol de investigación (RLS); se borra al revocar el consentimiento.
 */
import type { ParticipantProfile } from "@/domain/research/participant";
import type { Db } from "./gamificationRepository";

export async function loadParticipantProfile(db: Db, userId: string): Promise<ParticipantProfile | null> {
  const { data } = await db.from("participant_profile").select("age_band, gender, semester_band").eq("user_id", userId).maybeSingle();
  return data ? { ageBand: data.age_band, gender: data.gender, semesterBand: data.semester_band } : null;
}

export async function saveParticipantProfile(db: Db, userId: string, p: ParticipantProfile): Promise<void> {
  const { error } = await db.from("participant_profile").upsert(
    { user_id: userId, age_band: p.ageBand, gender: p.gender, semester_band: p.semesterBand, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw new Error("No se pudo guardar tu ficha. Intenta de nuevo.");
}

export async function deleteParticipantProfile(db: Db, userId: string): Promise<void> {
  const { error } = await db.from("participant_profile").delete().eq("user_id", userId);
  if (error) throw new Error("No se pudo borrar tu ficha. Intenta de nuevo.");
}
