import { useState, useEffect, useCallback } from "react";

export interface UserData {
  name: string;
  avatar: number;
  archetype: number | null;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  completedMissions: string[];
  inventory: string[];
}

const DEFAULT_USER: UserData = {
  name: "Héroe",
  avatar: 0,
  archetype: null,
  level: 3,
  xp: 450,
  coins: 350,
  gems: 12,
  completedMissions: ["Primera meditación", "Intro al diario"],
  inventory: [],
};

const AVATARS = ["🧙‍♂️", "🧝‍♀️", "🐉", "🦊", "🌟", "🦉"];
const ARCHETYPES = ["Guerrero", "Sanador", "Explorador", "Sabio"];

export function useUserStore() {
  const [user, setUser] = useState<UserData>(() => {
    try {
      const stored = localStorage.getItem("soulsync_user");
      return stored ? { ...DEFAULT_USER, ...JSON.parse(stored) } : DEFAULT_USER;
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

  const avatarEmoji = AVATARS[user.avatar] || "🧙‍♂️";
  const archetypeName = user.archetype !== null ? ARCHETYPES[user.archetype] : "Novato";

  return { user, updateUser, addCoins, spendCoins, spendGems, addToInventory, avatarEmoji, archetypeName };
}
