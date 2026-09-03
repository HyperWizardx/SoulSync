import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Coins, Gem, Sparkles } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";
import { STORE_ITEMS, RARITY_CLASS, MAX_EQUIPPED, getItem, type StoreItem } from "@/lib/items";
import { toast } from "sonner";

export const Route = createFileRoute("/store")({
  component: StorePage,
  head: () => ({
    meta: [
      { title: "Tienda de objetos | SoulSync" },
      { name: "description", content: "Compra pociones y reliquias que potencian tus misiones y transforman tu mundo emocional en SoulSync." },
      { property: "og:title", content: "Tienda de objetos | SoulSync" },
      { property: "og:description", content: "Consumibles y reliquias con efectos reales sobre misiones, atributos y el estado de tu mundo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function StorePage() {
  const { user, buyItem, useItem, toggleEquip } = useUserStore();

  const owned = (item: StoreItem) => user.items.find((i) => i.item_name === item.name);
  const equippedCount = user.items.filter((i) => i.equipped).length;

  const activeEffects = user.effects.map((e) => {
    const item = getItem(e.item_key);
    return { ...e, name: item?.name ?? e.item_key, emoji: item?.emoji ?? "✨" };
  });

  const handleBuy = async (item: StoreItem) => {
    const ok = await buyItem(item.name, item.price, item.currency);
    if (ok) toast.success(`¡Compraste ${item.name}!`, { icon: item.emoji });
  };

  const handleUse = async (item: StoreItem) => {
    const ok = await useItem(item.key);
    if (ok) toast.success(`${item.name} activado`, { description: item.detail, icon: item.emoji });
  };

  const handleEquip = async (item: StoreItem) => {
    const ok = await toggleEquip(item.key);
    if (ok) toast.success(`${item.name} actualizado`, { icon: item.emoji });
  };

  const consumables = STORE_ITEMS.filter((i) => i.kind === "consumable");
  const permanents = STORE_ITEMS.filter((i) => i.kind === "permanent");

  const renderItem = (item: StoreItem) => {
    const inv = owned(item);
    const qty = inv?.quantity ?? 0;
    return (
      <div
        key={item.key}
        className={`rounded-xl border bg-card p-3 transition-all duration-300 hover:scale-[1.02] ${
          item.rarity === "Legendario" ? "border-soul-gold/50" :
          item.rarity === "Épico" ? "border-primary/50" :
          item.rarity === "Raro" ? "border-soul-teal/50" : "border-border"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-3xl">{item.emoji}</span>
          <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium ${RARITY_CLASS[item.rarity]}`}>
            {item.rarity}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">{item.name}</p>
        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground/80">{item.detail}</p>

        {qty > 0 && (
          <p className="mt-2 text-[10px] font-medium text-soul-teal">
            {item.kind === "consumable" ? `En tu mochila: ${qty}` : inv?.equipped ? "Equipado" : "En tu mochila"}
          </p>
        )}

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => handleBuy(item)}
            disabled={item.kind === "permanent" && qty > 0}
            className="flex-1 rounded-lg bg-primary/10 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20 active:scale-95 disabled:opacity-40"
          >
            {item.kind === "permanent" && qty > 0
              ? "✓ Obtenido"
              : `${item.currency === "coins" ? "🪙" : "💎"} ${item.price}`}
          </button>
          {qty > 0 && item.kind === "consumable" && (
            <button
              onClick={() => handleUse(item)}
              className="flex-1 rounded-lg bg-soul-teal/15 py-1.5 text-xs font-semibold text-soul-teal transition-all hover:bg-soul-teal/25 active:scale-95"
            >
              Usar
            </button>
          )}
          {qty > 0 && item.kind === "permanent" && (
            <button
              onClick={() => handleEquip(item)}
              disabled={!inv?.equipped && equippedCount >= MAX_EQUIPPED}
              className="flex-1 rounded-lg bg-soul-gold/15 py-1.5 text-xs font-semibold text-soul-gold transition-all hover:bg-soul-gold/25 active:scale-95 disabled:opacity-40"
            >
              {inv?.equipped ? "Quitar" : "Equipar"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-cinzel font-bold text-foreground">Tienda</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Los objetos afectan de verdad tus misiones, atributos y el estado de tu mundo.
        </p>

        <div className="mt-4 flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card p-3">
            <Coins className="h-5 w-5 text-soul-gold" />
            <div>
              <p className="text-lg font-bold text-foreground">{user.coins}</p>
              <p className="text-[10px] text-muted-foreground">Monedas</p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card p-3">
            <Gem className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{user.gems}</p>
              <p className="text-[10px] text-muted-foreground">Gemas</p>
            </div>
          </div>
        </div>

        {activeEffects.length > 0 && (
          <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Efectos activos
            </p>
            <ul className="mt-2 space-y-1">
              {activeEffects.map((e) => (
                <li key={e.id} className="text-[11px] text-muted-foreground">
                  {e.emoji} {e.name} ·{" "}
                  {e.uses_left !== null
                    ? `${e.uses_left} misión(es) restantes`
                    : e.expires_at
                      ? `hasta ${new Date(e.expires_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`
                      : "activo"}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="mt-6 text-sm font-semibold text-foreground">Consumibles</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">{consumables.map(renderItem)}</div>

        <h2 className="mt-6 text-sm font-semibold text-foreground">
          Reliquias permanentes <span className="text-[10px] font-normal text-muted-foreground">(máx. {MAX_EQUIPPED} equipadas)</span>
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3">{permanents.map(renderItem)}</div>
      </div>
    </MobileLayout>
  );
}
