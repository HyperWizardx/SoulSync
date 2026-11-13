/** Completa misiones y coordina la actualización de progreso, bienestar y recompensas visuales. */
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { completeMissionServer } from '@/service/server-functions/missions.functions';
import type { MissionResponseInput } from '@/domain/gamification/missionResponses';

/** Resultado que devuelve el servidor (la recompensa real sale del catálogo de misiones). */
export interface MissionResult {
  ok: boolean;
  leveledUp: boolean;
  newLevel: number;
  unlockedAchievements: string[];
  gainedXp: number;
  gainedCoins: number;
  gainedGems: number;
  boosted: boolean;
  affinity: boolean;
}

export function useMissionActions(level: number) {
  const qc = useQueryClient();
  const completeMissionFn = useServerFn(completeMissionServer);
  const completeMissionMut = useMutation({
    // Solo se envía qué misión fue y cuánto duró: el servidor calcula la recompensa.
    mutationFn: (payload: { missionId: string; durationSeconds?: number; response?: MissionResponseInput }) =>
      completeMissionFn({ data: { missionId: payload.missionId, durationSeconds: payload.durationSeconds ?? 0, response: payload.response } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ["wellbeing"] });
      // Trofeos y gráfica semanal de Perfil dependen de las misiones completadas.
      qc.invalidateQueries({ queryKey: ["profile-summary"] });
      qc.invalidateQueries({ queryKey: ["weekly-stats"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
      qc.invalidateQueries({ queryKey: ["guild"] });
    },
  });

  const completeMission = useCallback(
    async (missionId: string, options?: { durationSeconds?: number; response?: MissionResponseInput }): Promise<MissionResult> => {
      try {
        // La pantalla decide cuándo celebrar (subida de nivel, logros) tras el aviso de misión cumplida.
        const res = await completeMissionMut.mutateAsync({ missionId, durationSeconds: options?.durationSeconds, response: options?.response });
        return { ok: true, ...res };
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error guardando misión");
        return { ok: false, leveledUp: false, newLevel: level, unlockedAchievements: [], gainedXp: 0, gainedCoins: 0, gainedGems: 0, boosted: false, affinity: false };
      }
    },
    [completeMissionMut, level]
  );

  return { completeMission };
}
