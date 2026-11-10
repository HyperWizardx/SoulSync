/**
 * Server functions de la ficha opcional del participante — capa de Servicio.
 * Autentican, validan con zod (solo valores conocidos) y delegan en el repositorio.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AGE_BANDS, GENDERS, SEMESTER_BANDS, type ParticipantProfile } from "@/domain/research/participant";
import { deleteParticipantProfile, loadParticipantProfile, saveParticipantProfile } from "@/infrastructure/persistence/supabase/participantRepository";
import { hasActiveConsent } from "@/infrastructure/persistence/supabase/wellbeingRepository";

const keys = (o: Record<string, string>) => Object.keys(o) as [string, ...string[]];

export const getParticipantProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ParticipantProfile | null> => loadParticipantProfile(context.supabase, context.userId));

export const saveMyParticipantProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ageBand: z.enum(keys(AGE_BANDS)), gender: z.enum(keys(GENDERS)), semesterBand: z.enum(keys(SEMESTER_BANDS)) }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await hasActiveConsent(context.supabase, context.userId))) throw new Error("Activa primero tu brújula (consentimiento) para compartir esta ficha.");
    await saveParticipantProfile(context.supabase, context.userId, data);
    return data;
  });

export const deleteMyParticipantProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => { await deleteParticipantProfile(context.supabase, context.userId); return { ok: true }; });
