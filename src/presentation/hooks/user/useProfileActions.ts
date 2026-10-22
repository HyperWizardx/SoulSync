/** Acciones de identidad y preferencias; conserva la actualización inmediata del perfil. */
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { updateProfile, updateSettings, type ProgressPayload } from '@/service/server-functions/progress.functions';
import { mergeProfile, type UserData, type UserSettings } from './userState';
export function useProfileActions() {
  const qc = useQueryClient();
  const updateProfileFn = useServerFn(updateProfile);
  const updateSettingsFn = useServerFn(updateSettings);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['progress'] });
  const profileMut = useMutation({
    mutationFn: (d: { name?: string; avatar?: number; archetype?: number | null }) =>
      updateProfileFn({ data: d }),
    onSuccess: (_result, variables) => {
      // Aplica los cambios al cache de inmediato (no solo invalidate, que
      // solo agenda un refetch en background). Esto es crítico: create-avatar
      // navega a /dashboard justo después de este await, y OnboardingGate lee
      // el mismo cache — si archetype no está ya actualizado aquí, el gate ve
      // el valor viejo (null) y rebota de vuelta a /create-avatar aunque el
      // guardado en el servidor haya sido exitoso.
      qc.setQueryData<ProgressPayload | undefined>(["progress"], (old) =>
        mergeProfile(old, variables)
      );
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const settingsMut = useMutation({
    mutationFn: (d: Partial<UserSettings>) =>
      updateSettingsFn({
        data: {
          theme: d.theme,
          textSize: d.textSize,
          dailyGoal: d.dailyGoal,
          onboarded: d.onboarded,
        },
      }),
    onSuccess: invalidate,
  });

  const updateUser = useCallback(
    (updates: Partial<Pick<UserData, "name" | "avatar" | "archetype">>) => {
      return profileMut.mutateAsync(updates);
    },
    [profileMut]
  );

  const updateUserSettings = useCallback(
    (updates: Partial<UserSettings>) => settingsMut.mutate(updates),
    [settingsMut]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    qc.clear();
  }, [qc]);

  return { updateUser, updateSettings: updateUserSettings, signOut };
}
