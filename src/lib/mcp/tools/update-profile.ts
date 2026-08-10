import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_profile",
  title: "Update player profile",
  description:
    "Update the signed-in SoulSync player's display name, avatar index or archetype (0 Guerrero, 1 Sanador, 2 Explorador, 3 Sabio).",
  inputSchema: {
    name: z.string().describe("Display name, 1-40 characters.").optional(),
    avatar: z.number().int().describe("Avatar index, 0-5.").optional(),
    archetype: z.number().int().describe("Archetype index: 0 Guerrero, 1 Sanador, 2 Explorador, 3 Sabio.").optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const patch: Record<string, unknown> = {};
    if (typeof input.name === "string") {
      const name = input.name.trim().slice(0, 40);
      if (!name) return { content: [{ type: "text", text: "El nombre no puede estar vacío." }], isError: true };
      patch.name = name;
    }
    if (typeof input.avatar === "number") patch.avatar = Math.min(Math.max(input.avatar, 0), 5);
    if (typeof input.archetype === "number") patch.archetype = Math.min(Math.max(input.archetype, 0), 3);
    if (Object.keys(patch).length === 0) {
      return { content: [{ type: "text", text: "Nada que actualizar." }], isError: true };
    }

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", ctx.getUserId())
      .select("name, avatar, archetype")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { profile: data },
    };
  },
});
