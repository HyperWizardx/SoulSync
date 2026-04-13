import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Coins, Gem } from "lucide-react";

export const Route = createFileRoute("/store")({
  component: StorePage,
});

const items = [
  { name: "Poción de Calma", desc: "+10 Mindfulness", price: 50, currency: "🪙", emoji: "🧪", rarity: "Común" },
  { name: "Escudo Emocional", desc: "+15 Resiliencia", price: 120, currency: "🪙", emoji: "🛡️", rarity: "Raro" },
  { name: "Orbe de Sabiduría", desc: "+20 Autoconocimiento", price: 5, currency: "💎", emoji: "🔮", rarity: "Épico" },
  { name: "Aura Dorada", desc: "Skin exclusiva", price: 10, currency: "💎", emoji: "✨", rarity: "Legendario" },
  { name: "Libro de Meditación", desc: "+5 Mindfulness", price: 30, currency: "🪙", emoji: "📕", rarity: "Común" },
  { name: "Corona de Empatía", desc: "+25 Empatía", price: 15, currency: "💎", emoji: "👑", rarity: "Legendario" },
];

function StorePage() {
  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-cinzel font-bold text-foreground">Tienda</h1>

        {/* Balance */}
        <div className="mt-4 flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card p-3">
            <Coins className="h-5 w-5 text-soul-gold" />
            <div>
              <p className="text-lg font-bold text-foreground">350</p>
              <p className="text-[10px] text-muted-foreground">Monedas</p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card p-3">
            <Gem className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">12</p>
              <p className="text-[10px] text-muted-foreground">Gemas</p>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.name} className={`rounded-xl border bg-card p-3 ${
              item.rarity === "Legendario" ? "border-soul-gold/50" :
              item.rarity === "Épico" ? "border-primary/50" :
              item.rarity === "Raro" ? "border-soul-teal/50" : "border-border"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-3xl">{item.emoji}</span>
                <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium ${
                  item.rarity === "Legendario" ? "bg-soul-gold/20 text-soul-gold" :
                  item.rarity === "Épico" ? "bg-primary/20 text-primary" :
                  item.rarity === "Raro" ? "bg-soul-teal/20 text-soul-teal" :
                  "bg-secondary text-muted-foreground"
                }`}>{item.rarity}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{item.name}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              <button className="mt-2 w-full rounded-lg bg-primary/10 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
                {item.currency} {item.price}
              </button>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
