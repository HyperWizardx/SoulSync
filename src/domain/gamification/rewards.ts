/** Contratos puros de recompensas y atributos; el dominio no depende de las pantallas. */
export interface UserStats {
  bienestar: number;
  resiliencia: number;
  energia: number;
  claridad: number;
}

export interface UserAttributes {
  resiliencia: number;
  empatia: number;
  mindfulness: number;
  autoconocimiento: number;
  conexionSocial: number;
  creatividad: number;
}

export type TaskCategoryName =
  | "autocuidado"
  | "reflexion"
  | "movimiento"
  | "social"
  | "cognitivo"
  | "ar";

export interface MissionReward {
  xp?: number;
  coins?: number;
  gems?: number;
  stats?: Partial<UserStats>;
  attributes?: Partial<UserAttributes>;
}

