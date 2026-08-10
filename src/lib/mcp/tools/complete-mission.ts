import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const XP_PER_LEVEL = 600;
const clamp = (n: number) => Math.max(0, Math.min(100, n));

export default defineTool({
  name: "complete_mission",
  title: "Complete a mission",
  description:
    "Record a completed SoulSync wellbeing mission for the signed-in player: awards XP, coins, gems, updates level, streak and wellbeing stats.",
  inputSchema: {
    missionId: z.string().describe("Stable identifier for the mission, e.g. 'gratitude'."),
    title: z.string().describe("Human-readable mission title shown in the history."),
    xp: z.number().int().describe("XP awarded (0-500).").optional(),
    coins: z.number().int().describe("Coins awarded (0-500).").optional(),
    gems: z.number().int().describe("Gems awarded (0-50).").optional(),
    isAR: z.boolean().describe("Whether this was an AR mission.").optional(),
    stats: z
      .object({
        bienestar: z.number().optional(),
        resiliencia: z.number().optional(),
        energia: z.number().optional(),
        claridad: z.number().optional(),
      })
      .describe("Deltas applied to the four wellbeing stats (each clamped to 0-100).")
      .optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const xpGain = Math.min(Math.max(input.xp ?? 0, 0), 500);
    const coinGain = Math.min(Math.max(input.coins ?? 0, 0), 500);
    const gemGain = Math.min(Math.max(input.gems ?? 0, 0), 50);

    const [p, s] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    if (p.error || s.error) {
      return { content: [{ type: "text", text: (p.error ?? s.error)!.message }], isError: true };
    }
    if (!p.data || !s.data) {
      return {
        content: [{ type: "text", text: "Perfil no inicializado. Abre la app primero." }],
        isError: true,
      };
    }

    let xp = p.data.xp + xpGain;
    let level = p.data.level;
    let leveledUp = false;
    while (xp >= XP_PER_LEVEL) {
      xp -= XP_PER_LEVEL;
      level += 1;
      leveledUp = true;
    }

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak =
      p.data.last_mission_date === today
        ? p.data.streak
        : p.data.last_mission_date === yesterday
          ? p.data.streak + 1
          : 1;

    const d = input.stats ?? {};
    const newStats = {
      bienestar: clamp(s.data.bienestar + (d.bienestar ?? 0)),
      resiliencia: clamp(s.data.resiliencia + (d.resiliencia ?? 0)),
      energia: clamp(s.data.energia + (d.energia ?? 0)),
      claridad: clamp(s.data.claridad + (d.claridad ?? 0)),
    };

    const [u1, u2, u3] = await Promise.all([
      supabase
        .from("profiles")
        .update({
          xp,
          level,
          streak,
          last_mission_date: today,
          coins: p.data.coins + coinGain,
          gems: p.data.gems + gemGain,
        })
        .eq("user_id", userId),
      supabase.from("user_stats").update(newStats).eq("user_id", userId),
      supabase.from("mission_completions").insert({
        user_id: userId,
        mission_id: input.missionId,
        title: input.title,
        xp_earned: xpGain,
        is_ar: input.isAR ?? false,
        completed_date: today,
      }),
    ]);
    const error = u1.error ?? u2.error ?? u3.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const result = { leveledUp, level, xp, streak, stats: newStats };
    return {
      content: [
        {
          type: "text",
          text: `Misión "${input.title}" registrada. Nivel ${level} (${xp}/${XP_PER_LEVEL} XP), racha ${streak} días.`,
        },
      ],
      structuredContent: result,
    };
  },
});
