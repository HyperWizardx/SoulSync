// Herramienta MCP "Completar misión": registra una misión del catálogo con las mismas reglas
// que la app (recompensa del catálogo, afinidad del arquetipo, objetos, racha y logros).
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "@/infrastructure/persistence/supabase/mcpClient";
import { completeCatalogMission } from "@/infrastructure/persistence/supabase/missionCompletion";
import { XP_PER_LEVEL } from "@/domain/gamification/progression";
import { MISSIONS } from "@/domain/gamification/missionsData";

export default defineTool({
  name: "complete_mission",
  title: "Complete a mission",
  description:
    "Record a completed SoulSync catalog mission for the signed-in player. Rewards come from the mission catalog " +
    "(plus the archetype affinity bonus and active items); updates XP, level, coins, gems, streak, stats and achievements.",
  inputSchema: {
    missionId: z.string().describe(`Catalog mission id, e.g. ${MISSIONS.slice(0, 3).map((m) => `'${m.id}'`).join(", ")}.`),
    durationSeconds: z.number().int().min(0).max(86_400).describe("How long the mission took, in seconds.").optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const userId = ctx.isAuthenticated() ? ctx.getUserId() : undefined;
    if (!userId) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    try {
      const result = await completeCatalogMission(supabaseForUser(ctx), userId, input);
      return {
        content: [{
          type: "text",
          text: `Misión "${input.missionId}" registrada: +${result.gainedXp} XP${result.affinity ? " (afín al arquetipo)" : ""}. ` +
            `Nivel ${result.newLevel} (${result.xp}/${XP_PER_LEVEL} XP), racha ${result.streak} días.`,
        }],
        structuredContent: result,
      };
    } catch (e) {
      return { content: [{ type: "text", text: e instanceof Error ? e.message : "Error" }], isError: true };
    }
  },
});
