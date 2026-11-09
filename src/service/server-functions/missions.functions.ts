/**
 * Server function "Completar misión" — capa de Servicio.
 * Autentica, valida y delega: la recompensa se toma del catálogo de misiones y la afinidad
 * del arquetipo del perfil (ver infrastructure/persistence/supabase/missionCompletion).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { completeCatalogMission } from "@/infrastructure/persistence/supabase/missionCompletion";

const CompleteMissionSchema = z.object({
  missionId: z.string().min(1).max(80),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
});

export const completeMissionServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CompleteMissionSchema.parse(d))
  .handler(async ({ data, context }) => completeCatalogMission(context.supabase, context.userId, data));
