/** Completa misiones y coordina la actualización de progreso, bienestar y recompensas visuales. */
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { completeMissionServer } from '@/service/server-functions/missions.functions';
import { emitFeedback } from '@/shared/feedback';
import type { MissionReward, TaskCategoryName, UserStats, UserAttributes } from './userState';
export function useMissionActions(level: number) {
  const qc = useQueryClient();
  const completeMissionFn = useServerFn(completeMissionServer);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['progress'] });
  const completeMissionMut = useMutation({
    mutationFn: (payload: {
      missionId: string;
      title: string;
      isAR?: boolean;
      category?: TaskCategoryName;
      durationSeconds?: number;
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
          category: payload.category ?? "autocuidado",
          durationSeconds: payload.durationSeconds ?? 0,
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
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["wellbeing"] });
    },
  });

  const completeMission = useCallback(
    async (
      missionId: string,
      missionTitle: string,
      reward: MissionReward,
      isAR = false,
      options?: { category?: TaskCategoryName; durationSeconds?: number }
    ) => {
      try {
        const res = await completeMissionMut.mutateAsync({
          missionId,
          title: missionTitle,
          isAR,
          category: options?.category,
          durationSeconds: options?.durationSeconds,
          xp: reward.xp,
          coins: reward.coins,
          gems: reward.gems,
          stats: reward.stats,
          attributes: reward.attributes,
        });
        if (res.leveledUp) {
          emitFeedback({ type: "levelup", level: res.newLevel });
        }
        for (const code of res.unlockedAchievements ?? []) {
          emitFeedback({ type: "achievement", code });
        }
        return res;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error guardando misión");
        return { leveledUp: false, newLevel: level, unlockedAchievements: [] as string[] };
      }
    },
    [completeMissionMut, level]
  );

  return { completeMission };
}
