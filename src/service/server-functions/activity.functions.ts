/**
 * Server functions de Actividad física — capa de Servicio.
 * Autentican, validan con zod y delegan en el repositorio; el resumen lo calcula el dominio.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { insertActivity, loadActivityWeek, type ActivityPayload } from "@/infrastructure/persistence/supabase/activityRepository";
import { evaluateAndGrant } from "@/infrastructure/persistence/supabase/gamificationRepository";

export type { ActivityPayload } from "@/infrastructure/persistence/supabase/activityRepository";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Semana actual de actividad. `today` = fecha local del teléfono (la semana va de lunes a domingo). */
export const getActivityWeek = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ today: isoDate }).parse(d))
  .handler(async ({ data, context }): Promise<ActivityPayload> => loadActivityWeek(context.supabase, context.userId, data.today));

/** Registra minutos de actividad de hoy (hasta 600 por registro). */
export const logActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      today: isoDate,
      minutes: z.number().int().min(1).max(600),
      intensity: z.enum(["moderada", "vigorosa"]),
      strength: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }): Promise<ActivityPayload & { unlockedAchievements: string[] }> => {
    await insertActivity(context.supabase, context.userId, { date: data.today, minutes: data.minutes, intensity: data.intensity, strength: data.strength });
    const [payload, unlockedAchievements] = await Promise.all([
      loadActivityWeek(context.supabase, context.userId, data.today),
      evaluateAndGrant(context.supabase, context.userId),
    ]);
    return { ...payload, unlockedAchievements };
  });
