/**
 * Server function "Completar misión" — capa de Servicio.
 * Autentica, valida y delega: la recompensa se toma del catálogo de misiones y la afinidad
 * del arquetipo del perfil (ver infrastructure/persistence/supabase/missionCompletion).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { completeCatalogMission } from "@/infrastructure/persistence/supabase/missionCompletion";
import { saveMissionResponse } from "@/infrastructure/persistence/supabase/missionResponseRepository";
import { getMissionById } from "@/domain/gamification/missionsData";

/** Lo que respondió el estudiante (opcional). El servidor arma el resto desde el catálogo. */
const ResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("quiz"), choices: z.array(z.number().int().min(-1).max(20)).max(20) }),
  z.object({ kind: z.literal("texto"), text: z.string().max(4000), mood: z.string().max(40).optional() }),
  z.object({ kind: z.literal("gratitud"), items: z.array(z.string().max(600)).max(5) }),
  z.object({ kind: z.literal("pasos"), done: z.array(z.number().int().min(0).max(30)).max(30) }),
  z.object({ kind: z.literal("reto"), challenge: z.string().max(200) }),
]);

const CompleteMissionSchema = z.object({
  missionId: z.string().min(1).max(80),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
  response: ResponseSchema.optional(),
});

export const completeMissionServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CompleteMissionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const result = await completeCatalogMission(context.supabase, context.userId, data);
    // La respuesta es para el acompañamiento: si no se puede guardar, la misión igual cuenta.
    const mission = getMissionById(data.missionId);
    if (data.response && mission) {
      try { await saveMissionResponse(context.supabase, context.userId, mission, data.response); } catch { /* sin bloquear la misión */ }
    }
    return result;
  });
