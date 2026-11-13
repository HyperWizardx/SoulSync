import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "@/infrastructure/persistence/supabase/mcpClient";
import { gameWriter } from "@/infrastructure/persistence/supabase/gameWriter";

export default defineTool({
  name: "update_profile",
  title: "Update player profile",
  description:
    "Update the signed-in SoulSync player's display name, avatar index or archetype (0 Caballero, 1 Bárbaro, 2 Pícaro, 3 Mago).",
  inputSchema: {
    name: z.string().describe("Display name, 1-40 characters.").optional(),
    avatar: z.number().int().describe("Avatar index, 0-5.").optional(),
    archetype: z.number().int().describe("Archetype index: 0 Caballero, 1 Bárbaro, 2 Pícaro, 3 Mago.").optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const patch: { name?: string; avatar?: number; archetype?: number } = {};
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

    // El perfil lo escribe solo el servidor (gameWriter), siempre filtrando por el usuario autenticado.
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const writer = await gameWriter(supabaseForUser(ctx));
    const { data, error } = await writer
      .from("profiles")
      .update(patch)
      .eq("user_id", userId)
      .select("name, avatar, archetype")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { profile: data },
    };
  },
});
