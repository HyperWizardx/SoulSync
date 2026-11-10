/**
 * Server functions de Gremios — capa de Servicio.
 * Autentican, validan con zod y delegan en el repositorio; las reglas viven en domain/community.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GUILD_EMBLEMS, cleanGuildName, isValidGuildCode, normalizeGuildCode } from "@/domain/community/guilds";
import { claimGuildChest, createGuild, joinGuild, leaveGuild, loadGuild, type GuildView } from "@/infrastructure/persistence/supabase/guildRepository";
import { evaluateAndGrant } from "@/infrastructure/persistence/supabase/gamificationRepository";

export type { GuildView } from "@/infrastructure/persistence/supabase/guildRepository";

/** Fecha local del teléfono; se acepta solo si está a un día de la del servidor (zonas horarias). */
const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (d) => Math.abs(Date.parse(`${d}T12:00:00Z`) - Date.now()) <= 2 * 86_400_000,
  "Fecha fuera de rango",
);
const emblem = z.enum(GUILD_EMBLEMS.map((e) => e.key) as [string, ...string[]]);

export interface GuildPayload { guild: GuildView | null; unlockedAchievements: string[] }

export const getMyGuild = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ today: localDate }).parse(d))
  .handler(async ({ data, context }): Promise<GuildView | null> => loadGuild(context.supabase, context.userId, data.today));

export const foundGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ today: localDate, name: z.string().max(60), emblem }).parse(d))
  .handler(async ({ data, context }): Promise<GuildPayload> => {
    const name = cleanGuildName(data.name);
    if (!name) throw new Error("El nombre debe tener entre 3 y 30 letras o números.");
    await createGuild(context.supabase, name, data.emblem);
    const [guild, unlockedAchievements] = await Promise.all([
      loadGuild(context.supabase, context.userId, data.today),
      evaluateAndGrant(context.supabase, context.userId),
    ]);
    return { guild, unlockedAchievements };
  });

export const enterGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ today: localDate, code: z.string().max(20) }).parse(d))
  .handler(async ({ data, context }): Promise<GuildPayload> => {
    const code = normalizeGuildCode(data.code);
    if (!isValidGuildCode(code)) throw new Error("El código tiene 6 letras y números. Revísalo e intenta de nuevo.");
    await joinGuild(context.supabase, code);
    const [guild, unlockedAchievements] = await Promise.all([
      loadGuild(context.supabase, context.userId, data.today),
      evaluateAndGrant(context.supabase, context.userId),
    ]);
    return { guild, unlockedAchievements };
  });

export const exitGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => { await leaveGuild(context.supabase); return { ok: true }; });

export const openGuildChest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ today: localDate }).parse(d))
  .handler(async ({ data, context }) => {
    const reward = await claimGuildChest(context.supabase, context.userId, data.today);
    const [guild, unlockedAchievements] = await Promise.all([
      loadGuild(context.supabase, context.userId, data.today),
      evaluateAndGrant(context.supabase, context.userId),
    ]);
    return { reward, guild, unlockedAchievements };
  });
