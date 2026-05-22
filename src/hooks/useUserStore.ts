import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getProgress,
  updateProfile,
  completeMissionServer,
  buyItem,
  migrateLocalProgress,
} from "@/lib/progress.functions";

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
  level: 1,
  xp: 0,
  coins: 100,
  gems: 5,
  streak: 0,
  lastMissionDate: null,
  completedMissions: [],
  missionHistory: [],
  inventory: [],
  stats: { bienestar: 50, resiliencia: 50, energia: 50, claridad: 50 },
  attributes: {
    resiliencia: 30,
    empatia: 30,
    mindfulness: 30,
    autoconocimiento: 30,
    conexionSocial: 30,
    creatividad: 30,
  },
};

const AVATARS = ["🧙‍♂️", "🧝‍♀️", "🐉", "🦊", "🌟", "🦉"];
const ARCHETYPES = ["Guerrero", "Sanador", "Explorador", "Sabio"];
const MIGRATED_KEY = "soulsync_migrated";

export function useUserStore() {
  const qc = useQueryClient();
  const getProgressFn = useServerFn(getProgress);
  const completeMissionFn = useServerFn(completeMissionServer);
  const updateProfileFn = useServerFn(updateProfile);
  const buyItemFn = useServerFn(buyItem);
  const migrateFn = useServerFn(migrateLocalProgress);
  const migratedRef = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["progress"],
    queryFn: () => getProgressFn(),
    staleTime: 10_000,
  });

  // Migrate localStorage → server, only once
  useEffect(() => {
    if (!data || migratedRef.current) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(MIGRATED_KEY)) return;
    const raw = localStorage.getItem("soulsync_user");
    if (!raw) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }
    migratedRef.current = true;
    try {
      const parsed = JSON.parse(raw);
      migrateFn({
        data: {
          name: parsed.name,
          avatar: parsed.avatar,
          archetype: parsed.archetype,
          level: parsed.level,
          xp: parsed.xp,
          coins: parsed.coins,
          gems: parsed.gems,
          streak: parsed.streak,
          stats: parsed.stats,
          attributes: parsed.attributes,
          inventory: parsed.inventory,
        },
      }).then(() => {
        localStorage.setItem(MIGRATED_KEY, "1");
        localStorage.removeItem("soulsync_user");
        qc.invalidateQueries({ queryKey: ["progress"] });
      }).catch(() => {});
    } catch {
      localStorage.setItem(MIGRATED_KEY, "1");
    }
  }, [data, migrateFn, qc]);

  const user: UserData = data
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
        completedMissions: data.history.map((h) => h.title),
        missionHistory: data.history.map((h) => ({
          id: h.mission_id,
          title: h.title,
          date: new Date(h.completed_at).toDateString(),
          xp: h.xp_earned,
        })),
        inventory: data.inventory,
        stats: data.stats,
        attributes: {
          resiliencia: data.attributes.resiliencia,
          empatia: data.attributes.empatia,
          mindfulness: data.attributes.mindfulness,
          autoconocimiento: data.attributes.autoconocimiento,
          conexionSocial: data.attributes.conexion_social,
          creatividad: data.attributes.creatividad,
        },
      }
    : DEFAULT_USER;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["progress"] });

  const profileMut = useMutation({
    mutationFn: (d: { name?: string; avatar?: number; archetype?: number | null }) =>
      updateProfileFn({ data: d }),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const completeMissionMut = useMutation({
    mutationFn: (payload: {
      missionId: string;
      title: string;
      isAR?: boolean;
      xp?: number;
      coins?: number;
      gems?: number;
      stats?: Partial<UserStats>;
      attributes?: Partial<UserAttributes>;
    }) =>
      completeMissionFn({
        data: {
          missionId: payload.missionId,
          title: payload.title,
          isAR: payload.isAR ?? false,
          xp: payload.xp ?? 0,
          coins: payload.coins ?? 0,
          gems: payload.gems ?? 0,
          stats: payload.stats ?? {},
          attributes: payload.attributes
            ? {
                resiliencia: payload.attributes.resiliencia,
                empatia: payload.attributes.empatia,
                mindfulness: payload.attributes.mindfulness,
                autoconocimiento: payload.attributes.autoconocimiento,
                conexion_social: payload.attributes.conexionSocial,
                creatividad: payload.attributes.creatividad,
              }
            : {},
        },
      }),
    onSuccess: invalidate,
  });

  const buyMut = useMutation({
    mutationFn: (d: { itemName: string; price: number; currency: "coins" | "gems" }) =>
      buyItemFn({ data: d }),
    onSuccess: invalidate,
  });

  const updateUser = useCallback(
    (updates: Partial<Pick<UserData, "name" | "avatar" | "archetype">>) => {
      profileMut.mutate(updates);
    },
    [profileMut]
  );

  const completeMission = useCallback(
    async (
      missionId: string,
      missionTitle: string,
      reward: MissionReward,
      isAR = false
    ) => {
      try {
        const res = await completeMissionMut.mutateAsync({
          missionId,
          title: missionTitle,
          isAR,
          xp: reward.xp,
          coins: reward.coins,
          gems: reward.gems,
          stats: reward.stats,
          attributes: reward.attributes,
        });
        return res;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error guardando misión");
        return { leveledUp: false, newLevel: user.level };
      }
    },
    [completeMissionMut, user.level]
  );

  const buyItemAction = useCallback(
    async (itemName: string, price: number, currency: "coins" | "gems") => {
      try {
        await buyMut.mutateAsync({ itemName, price, currency });
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo comprar");
        return false;
      }
    },
    [buyMut]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    qc.clear();
  }, [qc]);

  const avatarEmoji = AVATARS[user.avatar] || "🧙‍♂️";
  const archetypeName = user.archetype !== null ? ARCHETYPES[user.archetype] : "Novato";

  return {
    user,
    isLoading,
    updateUser,
    completeMission,
    buyItem: buyItemAction,
    signOut,
    avatarEmoji,
    archetypeName,
  };
}
