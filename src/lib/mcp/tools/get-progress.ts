import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_progress",
  title: "Get progress",
  description:
    "Get the signed-in SoulSync player's profile: level, XP, coins, gems, streak, wellbeing stats and RPG attributes.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [p, s, a, ach] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_attributes").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("achievements").select("code").eq("user_id", userId),
    ]);
    const error = p.error ?? s.error ?? a.error ?? ach.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!p.data) {
      return {
        content: [{ type: "text", text: "No hay perfil todavía. Abre la app para crear tu personaje." }],
        isError: true,
      };
    }
    const payload = {
      profile: p.data,
      stats: s.data,
      attributes: a.data,
      achievements: (ach.data ?? []).map((r) => r.code),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
