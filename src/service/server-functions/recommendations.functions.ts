/**
 * Server function "Elegidas para ti" — capa de Servicio.
 * Autentica y delega en el recomendador propio (muestreo de Thompson).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadRecommendations, type RecommendationsPayload } from "@/infrastructure/persistence/supabase/recommendationRepository";

export type { RecommendationsPayload } from "@/infrastructure/persistence/supabase/recommendationRepository";

export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RecommendationsPayload> => loadRecommendations(context.supabase, context.userId));
