import { useState, useEffect, useCallback } from "react";

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

export interface MissionReward {
  xp?: number;
  coins?: number;
  gems?: number;
  stats?: Partial<UserStats>;
  attributes?: Partial<UserAttributes>;
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
  stats: UserStats;
  attributes: UserAttributes;
}

const DEFAULT_USER: UserData = {
  name: "Héroe",
  avatar: 0,
  archetype: null,
  level: 3,
  xp: 450,
  coins: 350,
  gems: 12,
  streak: 0,
  lastMissionDate: null,
  completedMissions: ["Primera meditación", "Intro al diario"],
  missionHistory: [],
  inventory: [],
  stats: { bienestar: 72, resiliencia: 58, energia: 85, claridad: 64 },
  attributes: {
    resiliencia: 58,
    empatia: 72,
    mindfulness: 45,
    autoconocimiento: 64,
    conexionSocial: 38,
    creatividad: 80,
  },
};

const AVATARS = ["🧙‍♂️", "🧝‍♀️", "🐉", "🦊", "🌟", "🦉"];
const ARCHETYPES = ["Guerrero", "Sanador", "Explorador", "Sabio"];
const XP_PER_LEVEL = 600;

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function useUserStore() {
  const [user, setUser] = useState<UserData>(() => {
    try {
      const stored = localStorage.getItem("soulsync_user");
      if (!stored) return DEFAULT_USER;
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_USER,
        ...parsed,
        stats: { ...DEFAULT_USER.stats, ...(parsed.stats || {}) },
        attributes: { ...DEFAULT_USER.attributes, ...(parsed.attributes || {}) },
      };
    } catch {
      return DEFAULT_USER;
    }
  });

  useEffect(() => {
    localStorage.setItem("soulsync_user", JSON.stringify(user));
  }, [user]);

  const updateUser = useCallback((updates: Partial<UserData>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const addCoins = useCallback((amount: number) => {
    setUser((prev) => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setUser((prev) => {
      if (prev.coins >= amount) {
        success = true;
        return { ...prev, coins: prev.coins - amount };
      }
      return prev;
    });
    return success;
  }, []);

  const spendGems = useCallback((amount: number): boolean => {
    let success = false;
    setUser((prev) => {
      if (prev.gems >= amount) {
        success = true;
        return { ...prev, gems: prev.gems - amount };
      }
      return prev;
    });
    return success;
  }, []);

  const addToInventory = useCallback((item: string) => {
    setUser((prev) => ({ ...prev, inventory: [...prev.inventory, item] }));
  }, []);

  /** Aplica una recompensa de misión: XP, monedas, gemas, stats y atributos.
   *  Retorna { leveledUp, newLevel } */
  const completeMission = useCallback(
    (missionId: string, missionTitle: string, reward: MissionReward) => {
      let leveledUp = false;
      let newLevel = 0;
      setUser((prev) => {
        const today = new Date().toDateString();
        const newXp = prev.xp + (reward.xp || 0);
        let level = prev.level;
        let xpFinal = newXp;
        while (xpFinal >= XP_PER_LEVEL) {
          xpFinal -= XP_PER_LEVEL;
          level += 1;
          leveledUp = true;
        }
        newLevel = level;

        const streak =
          prev.lastMissionDate === today
            ? prev.streak
            : prev.lastMissionDate === new Date(Date.now() - 86400000).toDateString()
            ? prev.streak + 1
            : 1;

        const stats = { ...prev.stats };
        if (reward.stats) {
          (Object.keys(reward.stats) as (keyof UserStats)[]).forEach((k) => {
            stats[k] = clamp(stats[k] + (reward.stats![k] || 0));
          });
        }
        const attributes = { ...prev.attributes };
        if (reward.attributes) {
          (Object.keys(reward.attributes) as (keyof UserAttributes)[]).forEach((k) => {
            attributes[k] = clamp(attributes[k] + (reward.attributes![k] || 0));
          });
        }

        return {
          ...prev,
          xp: xpFinal,
          level,
          coins: prev.coins + (reward.coins || 0),
          gems: prev.gems + (reward.gems || 0),
          streak,
          lastMissionDate: today,
          stats,
          attributes,
          completedMissions: prev.completedMissions.includes(missionTitle)
            ? prev.completedMissions
            : [...prev.completedMissions, missionTitle],
          missionHistory: [
            { id: missionId, title: missionTitle, date: today, xp: reward.xp || 0 },
            ...prev.missionHistory,
          ].slice(0, 50),
        };
      });
      return { leveledUp, newLevel };
    },
    []
  );

  const resetProgress = useCallback(() => {
    setUser(DEFAULT_USER);
  }, []);

  const avatarEmoji = AVATARS[user.avatar] || "🧙‍♂️";
  const archetypeName = user.archetype !== null ? ARCHETYPES[user.archetype] : "Novato";

  return {
    user,
    updateUser,
    addCoins,
    spendCoins,
    spendGems,
    addToInventory,
    completeMission,
    resetProgress,
    avatarEmoji,
    archetypeName,
  };
}
