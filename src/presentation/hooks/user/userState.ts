/** Tipos y traducción pura del progreso persistido al estado de presentación. */
import type { ProgressPayload, InventoryItem, ActiveEffect } from '@/service/server-functions/progress.functions';
import type { UserStats, UserAttributes } from '@/domain/gamification/rewards';
export type { UserStats, UserAttributes, MissionReward, TaskCategoryName } from '@/domain/gamification/rewards';

export interface UserSettings {
  theme: "dark" | "light";
  textSize: "normal" | "large" | "xl";
  dailyGoal: number;
  onboarded: boolean;
}

export interface UserData {
  name: string;
  avatar: number;
  archetype: number | null;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  streak: number;
  lastMissionDate: string | null;
  completedMissions: string[];
  missionHistory: { id: string; title: string; date: string; xp: number }[];
  inventory: string[];
  items: InventoryItem[];
  effects: ActiveEffect[];
  stats: UserStats;
  attributes: UserAttributes;
  achievements: string[];
  settings: UserSettings;
}

export const DEFAULT_USER: UserData = {
  name: "Héroe",
  avatar: 0,
  archetype: null,
  level: 1,
  xp: 0,
  coins: 100,
  gems: 5,
  streak: 0,
  lastMissionDate: null,
  completedMissions: [],
  missionHistory: [],
  inventory: [],
  items: [],
  effects: [],
  stats: { bienestar: 50, resiliencia: 50, energia: 50, claridad: 50 },
  attributes: {
    resiliencia: 30,
    empatia: 30,
    mindfulness: 30,
    autoconocimiento: 30,
    conexionSocial: 30,
    creatividad: 30,
  },
  achievements: [],
  settings: { theme: "dark", textSize: "normal", dailyGoal: 3, onboarded: false },
};


export function toUserData(data: ProgressPayload | undefined): UserData {
  return data?.profile
    ? {
        name: data.profile.name,
        avatar: data.profile.avatar,
        archetype: data.profile.archetype,
        level: data.profile.level,
        xp: data.profile.xp,
        coins: data.profile.coins,
        gems: data.profile.gems,
        streak: data.profile.streak,
        lastMissionDate: data.profile.last_mission_date,
        completedMissions: (data.history ?? []).map((h) => h.title),
        missionHistory: (data.history ?? []).map((h) => ({
          id: h.mission_id,
          title: h.title,
          date: new Date(h.completed_at).toDateString(),
          xp: h.xp_earned,
        })),
        inventory: data.inventory ?? [],
        items: data.items ?? [],
        effects: data.effects ?? [],
        stats: data.stats ?? DEFAULT_USER.stats,
        attributes: data.attributes
          ? {
              resiliencia: data.attributes.resiliencia,
              empatia: data.attributes.empatia,
              mindfulness: data.attributes.mindfulness,
              autoconocimiento: data.attributes.autoconocimiento,
              conexionSocial: data.attributes.conexion_social,
              creatividad: data.attributes.creatividad,
            }
          : DEFAULT_USER.attributes,
        achievements: data.achievements ?? [],
        settings: {
          theme: (data.profile.theme as "dark" | "light") ?? "dark",
          textSize: (data.profile.text_size as "normal" | "large" | "xl") ?? "normal",
          dailyGoal: data.profile.daily_goal ?? 3,
          onboarded: data.profile.onboarded ?? false,
        },
      }
    : DEFAULT_USER;

}

/** Actualiza el perfil antes de que otra pantalla consulte el mismo progreso. */
export function mergeProfile(data: ProgressPayload | undefined, updates: Partial<Pick<UserData, 'name' | 'avatar' | 'archetype'>>): ProgressPayload | undefined {
  return data ? { ...data, profile: { ...data.profile, ...updates } } : data;
}
