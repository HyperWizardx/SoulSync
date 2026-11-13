/**
 * Server functions "Elegidas para ti" — capa de Servicio.
 * Autentican, validan con zod y delegan en el recomendador propio (muestreo de Thompson).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadRecommendations, saveMissionFeedback, type RecommendationsPayload } from "@/infrastructure/persistence/supabase/recommendationRepository";

export type { RecommendationsPayload } from "@/infrastructure/persistence/supabase/recommendationRepository";

/** reroll > 0 cuando el estudiante pide "Otras opciones". */
export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ reroll: z.number().int().min(0).max(50).optional() }).optional().parse(d))
  .handler(async ({ data, context }): Promise<RecommendationsPayload> => loadRecommendations(context.supabase, context.userId, data?.reroll ?? 0));

/** Voto "¿Te sirvió?" al terminar una misión: el recomendador lo usa como recompensa directa. */
export const sendMissionFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ missionId: z.string().min(1).max(64), helpful: z.boolean() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await saveMissionFeedback(context.supabase, context.userId, data.missionId, data.helpful);
    return { ok: true };
  });
