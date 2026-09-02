/**
 * Catálogo de objetos de la tienda. Compartido cliente/servidor.
 * Los efectos se aplican en el servidor (progress.functions.ts) al completar
 * misiones y al recalcular el Mundo.
 */
export type ItemKind = "consumable" | "permanent";

export type ItemEffectType =
  | "xp_multiplier"
  | "coin_multiplier"
  | "attribute_bonus"
  | "world_vitality"
  | "world_harmony"
  | "streak_shield";

export interface ItemEffect {
  effect: ItemEffectType;
  /** Multiplicador (1.5 = +50%), puntos de atributo o puntos de mundo */
  magnitude: number;
  /** Nº de misiones en las que aplica (consumibles por usos) */
  uses?: number;
  /** Duración en horas (consumibles por tiempo) */
  hours?: number;
  /** Atributo afectado cuando effect = attribute_bonus */
  attribute?:
    | "resiliencia"
    | "empatia"
    | "mindfulness"
    | "autoconocimiento"
    | "conexion_social"
    | "creatividad";
}

export interface StoreItem {
  key: string;
  name: string;
  desc: string;
  detail: string;
  price: number;
  currency: "coins" | "gems";
  emoji: string;
  rarity: "Común" | "Raro" | "Épico" | "Legendario";
  kind: ItemKind;
  effects: ItemEffect[];
}

export const STORE_ITEMS: StoreItem[] = [
  {
    key: "pocion_calma",
    name: "Poción de Calma",
    desc: "+3 Mindfulness en 2 misiones",
    detail: "Durante las próximas 2 misiones ganas mindfulness extra y el estrés pesa menos en tu mundo.",
    price: 50,
    currency: "coins",
    emoji: "🧪",
    rarity: "Común",
    kind: "consumable",
    effects: [
      { effect: "attribute_bonus", magnitude: 3, uses: 2, attribute: "mindfulness" },
      { effect: "world_harmony", magnitude: 5, hours: 24 },
    ],
  },
  {
    key: "elixir_energia",
    name: "Elixir de Energía",
    desc: "x1.5 XP · 3 misiones",
    detail: "Multiplica por 1.5 la experiencia de tus próximas 3 misiones.",
    price: 80,
    currency: "coins",
    emoji: "⚡",
    rarity: "Raro",
    kind: "consumable",
    effects: [{ effect: "xp_multiplier", magnitude: 1.5, uses: 3 }],
  },
  {
    key: "escudo_emocional",
    name: "Escudo Emocional",
    desc: "Protege tu racha 1 día",
    detail: "Si un día no completas misiones, se consume solo y mantiene tu racha viva.",
    price: 120,
    currency: "coins",
    emoji: "🛡️",
    rarity: "Raro",
    kind: "consumable",
    effects: [{ effect: "streak_shield", magnitude: 1, uses: 1, hours: 72 }],
  },
  {
    key: "tonico_enfoque",
    name: "Tónico de Enfoque",
    desc: "x2 monedas · 2 misiones",
    detail: "Duplica las monedas que ganas en tus próximas 2 misiones.",
    price: 70,
    currency: "coins",
    emoji: "🍵",
    rarity: "Común",
    kind: "consumable",
    effects: [{ effect: "coin_multiplier", magnitude: 2, uses: 2 }],
  },
  {
    key: "semilla_vitalidad",
    name: "Semilla de Vitalidad",
    desc: "+10 Vitalidad del mundo",
    detail: "Planta vitalidad inmediata en tu mundo durante 24 horas.",
    price: 40,
    currency: "coins",
    emoji: "🌱",
    rarity: "Común",
    kind: "consumable",
    effects: [{ effect: "world_vitality", magnitude: 10, hours: 24 }],
  },
  {
    key: "incienso_armonia",
    name: "Incienso de Armonía",
    desc: "+10 Armonía · 24 h",
    detail: "Despeja la niebla y la tormenta subiendo la armonía de tu mundo por un día.",
    price: 3,
    currency: "gems",
    emoji: "🕯️",
    rarity: "Épico",
    kind: "consumable",
    effects: [{ effect: "world_harmony", magnitude: 10, hours: 24 }],
  },
  {
    key: "libro_meditacion",
    name: "Libro de Meditación",
    desc: "+2 Mindfulness · 5 misiones",
    detail: "Cada una de tus próximas 5 misiones te da mindfulness extra.",
    price: 30,
    currency: "coins",
    emoji: "📕",
    rarity: "Común",
    kind: "consumable",
    effects: [{ effect: "attribute_bonus", magnitude: 2, uses: 5, attribute: "mindfulness" }],
  },
  {
    key: "corona_empatia",
    name: "Corona de Empatía",
    desc: "+8 Empatía equipada",
    detail: "Objeto permanente. Mientras esté equipada suma empatía en cada misión social.",
    price: 15,
    currency: "gems",
    emoji: "👑",
    rarity: "Legendario",
    kind: "permanent",
    effects: [{ effect: "attribute_bonus", magnitude: 3, attribute: "empatia" }],
  },
  {
    key: "aura_dorada",
    name: "Aura Dorada",
    desc: "+15% XP permanente",
    detail: "Objeto permanente. Cambia el aura de tu avatar y aumenta toda la XP que ganas.",
    price: 10,
    currency: "gems",
    emoji: "✨",
    rarity: "Legendario",
    kind: "permanent",
    effects: [{ effect: "xp_multiplier", magnitude: 1.15 }],
  },
  {
    key: "orbe_sabiduria",
    name: "Orbe de Sabiduría",
    desc: "+3 Autoconocimiento equipado",
    detail: "Objeto permanente. Suma autoconocimiento en cada misión mientras lo lleves.",
    price: 5,
    currency: "gems",
    emoji: "🔮",
    rarity: "Épico",
    kind: "permanent",
    effects: [{ effect: "attribute_bonus", magnitude: 3, attribute: "autoconocimiento" }],
  },
];

export const MAX_EQUIPPED = 2;

export function getItem(key: string): StoreItem | undefined {
  return STORE_ITEMS.find((i) => i.key === key);
}

export function getItemByName(name: string): StoreItem | undefined {
  return STORE_ITEMS.find((i) => i.name === name);
}

export const RARITY_CLASS: Record<StoreItem["rarity"], string> = {
  Común: "bg-secondary text-muted-foreground",
  Raro: "bg-soul-teal/20 text-soul-teal",
  Épico: "bg-primary/20 text-primary",
  Legendario: "bg-soul-gold/20 text-soul-gold",
};
