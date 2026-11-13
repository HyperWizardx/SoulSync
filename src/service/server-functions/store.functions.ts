/**
 * Server functions de la Tienda — capa de Servicio.
 * Comprar, usar consumibles y equipar permanentes. El catálogo y las reglas
 * de efectos viven en el Dominio (domain/gamification/items).
 * Lee con la sesión del usuario y escribe con gameWriter: el navegador no puede tocar su
 * saldo ni su inventario. Los descuentos son condicionales para que dos peticiones a la vez
 * no gasten el mismo saldo ni el mismo objeto dos veces.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addTimelineEvent, hasActiveConsent } from "@/infrastructure/persistence/supabase/wellbeingRepository";
import { evaluateAndGrant } from "@/infrastructure/persistence/supabase/gamificationRepository";
import { gameWriter } from "@/infrastructure/persistence/supabase/gameWriter";
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
    if (existing && item.kind === "permanent") throw new Error("Ya tienes este objeto");

    // 1. Cobrar primero, solo si el saldo sigue siendo el que se leyó (evita gastar dos veces).
    const writer = await gameWriter(supabase);
    const charge = item.currency === "coins"
      ? writer.from("profiles").update({ coins: balance - item.price }).eq("user_id", userId).eq("coins", balance)
      : writer.from("profiles").update({ gems: balance - item.price }).eq("user_id", userId).eq("gems", balance);
    const { data: charged, error: upErr } = await charge.select("user_id");
    if (upErr) throw new Error(upErr.message);
    if (!charged?.length) throw new Error("Tu saldo acaba de cambiar. Intenta de nuevo.");

    // 2. Entregar el objeto; si falla, se devuelve lo cobrado.
    const { error } = existing
      ? await writer
        .from("inventory")
        .update({ quantity: ((existing.quantity as number | null) ?? 1) + 1, item_key: item.key, kind: item.kind })
        .eq("id", existing.id)
        .eq("user_id", userId)
      : await writer.from("inventory").insert({
        user_id: userId,
        item_name: item.name,
        item_key: item.key,
        kind: item.kind,
        quantity: 1,
      });
    if (error) {
      const refund = item.currency === "coins" ? { coins: balance } : { gems: balance };
      await writer.from("profiles").update(refund).eq("user_id", userId);
      throw new Error("No se pudo entregar el objeto. No se te cobró.");
    }

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

    // 1. Descontar la unidad solo si la cantidad sigue igual (dos toques a la vez usan un solo objeto).
    const writer = await gameWriter(supabase);
    const take = qty <= 1
      ? writer.from("inventory").delete().eq("id", row.id).eq("user_id", userId).eq("quantity", qty)
      : writer.from("inventory").update({ quantity: qty - 1 }).eq("id", row.id).eq("user_id", userId).eq("quantity", qty);
    const { data: taken, error: takeErr } = await take.select("id");
    if (takeErr) throw new Error(takeErr.message);
    if (!taken?.length) throw new Error("Ese objeto ya se usó. Intenta de nuevo.");

    // 2. Activar sus efectos.
    const now = Date.now();
    const rows = item.effects.map((e) => ({
      user_id: userId,
      item_key: item.key,
      effect: e.effect,
      magnitude: e.magnitude,
      uses_left: e.uses ?? null,
      expires_at: e.hours ? new Date(now + e.hours * 3_600_000).toISOString() : null,
    }));
    const { error } = await writer.from("item_effects").insert(rows);
    if (error) throw new Error(error.message);

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
    const writer = await gameWriter(supabase);
    const { error } = await writer
      .from("inventory")
      .update({ equipped: next, item_key: item.key, kind: item.kind })
      .eq("id", target.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, equipped: next };
  });
