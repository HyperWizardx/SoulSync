/**
 * Server functions de la Tienda — capa de Servicio.
 * Comprar, usar consumibles y equipar permanentes. El catálogo y las reglas
 * de efectos viven en el Dominio (domain/gamification/items).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addTimelineEvent, hasActiveConsent } from "@/infrastructure/persistence/supabase/wellbeingRepository";
import { evaluateAndGrant } from "@/infrastructure/persistence/supabase/gamificationRepository";
import { getItem, getItemByName, MAX_EQUIPPED } from "@/domain/gamification/items";

/** Compra validada contra el catálogo (el precio del cliente no es fiable). */
const BuySchema = z.object({
  itemName: z.string().min(1).max(80),
  price: z.number().int().min(0).max(1000),
  currency: z.enum(["coins", "gems"]),
});

export const buyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => BuySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const item = getItemByName(data.itemName);
    if (!item) throw new Error("Objeto no disponible");
    if (item.price !== data.price || item.currency !== data.currency) {
      throw new Error("Precio inválido");
    }

    const { data: prof, error: pErr } = await supabase
      .from("profiles").select("coins,gems").eq("user_id", userId).single();
    if (pErr || !prof) throw new Error("Perfil no encontrado");

    const balance = data.currency === "coins" ? prof.coins : prof.gems;
    if (balance < item.price) throw new Error("Saldo insuficiente");

    const { data: existing } = await supabase
      .from("inventory")
      .select("id,quantity")
      .eq("user_id", userId)
      .eq("item_name", item.name)
      .maybeSingle();

    if (existing) {
      if (item.kind === "permanent") throw new Error("Ya tienes este objeto");
      const { error } = await supabase
        .from("inventory")
        .update({ quantity: ((existing.quantity as number | null) ?? 1) + 1, item_key: item.key, kind: item.kind })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("inventory").insert({
        user_id: userId,
        item_name: item.name,
        item_key: item.key,
        kind: item.kind,
        quantity: 1,
      });
      if (error) throw new Error(error.message);
    }

    const update = item.currency === "coins"
      ? { coins: prof.coins - item.price }
      : { gems: prof.gems - item.price };
    const { error: upErr } = await supabase.from("profiles").update(update).eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);

    return { ok: true, unlockedAchievements: await evaluateAndGrant(supabase, userId) };
  });

/** Usa un consumible: crea sus efectos activos y descuenta una unidad. */
export const useItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ itemKey: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const item = getItem(data.itemKey);
    if (!item || item.kind !== "consumable") throw new Error("Objeto no usable");

    const { data: row } = await supabase
      .from("inventory")
      .select("id,quantity")
      .eq("user_id", userId)
      .eq("item_name", item.name)
      .maybeSingle();
    const qty = (row?.quantity as number | null) ?? 0;
    if (!row || qty < 1) throw new Error("No tienes este objeto");

    const now = Date.now();
    const rows = item.effects.map((e) => ({
      user_id: userId,
      item_key: item.key,
      effect: e.effect,
      magnitude: e.magnitude,
      uses_left: e.uses ?? null,
      expires_at: e.hours ? new Date(now + e.hours * 3_600_000).toISOString() : null,
    }));
    const { error } = await supabase.from("item_effects").insert(rows);
    if (error) throw new Error(error.message);

    if (qty <= 1) await supabase.from("inventory").delete().eq("id", row.id);
    else await supabase.from("inventory").update({ quantity: qty - 1 }).eq("id", row.id);

    if (await hasActiveConsent(supabase, userId)) {
      await addTimelineEvent(supabase, userId, {
        kind: "milestone",
        title: `Usaste ${item.name}`,
        detail: item.detail,
        payload: { itemKey: item.key },
      });
    }

    return { ok: true, unlockedAchievements: await evaluateAndGrant(supabase, userId, { itemsUsed: 1 }) };
  });

/** Equipa o desequipa un objeto permanente (máx. MAX_EQUIPPED a la vez). */
export const toggleEquip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ itemKey: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const item = getItem(data.itemKey);
    if (!item || item.kind !== "permanent") throw new Error("Objeto no equipable");

    const { data: rows } = await supabase
      .from("inventory")
      .select("id,item_name,equipped")
      .eq("user_id", userId);
    const target = (rows ?? []).find((r) => r.item_name === item.name);
    if (!target) throw new Error("No tienes este objeto");

    const equippedCount = (rows ?? []).filter((r) => r.equipped).length;
    const next = !target.equipped;
    if (next && equippedCount >= MAX_EQUIPPED) {
      throw new Error(`Solo puedes equipar ${MAX_EQUIPPED} objetos a la vez`);
    }
    const { error } = await supabase
      .from("inventory")
      .update({ equipped: next, item_key: item.key, kind: item.kind })
      .eq("id", target.id);
    if (error) throw new Error(error.message);
    return { ok: true, equipped: next };
  });
