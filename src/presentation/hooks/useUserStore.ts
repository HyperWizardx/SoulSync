/** Fachada compatible del estado del usuario: compone lectura y acciones por responsabilidad. */
import { getArchetypeStyle } from '@/domain/identity/archetype';
import { toUserData } from './user/userState';
import { useProgressQuery } from './user/useProgressQueries';
import { useProfileActions } from './user/useProfileActions';
import { useMissionActions } from './user/useMissionActions';
import { useInventoryActions } from './user/useInventoryActions';
export type { UserStats, UserAttributes, TaskCategoryName, MissionReward, UserSettings, UserData } from './user/userState';
export { useProfileSummary, useWeeklyStats } from './user/useProgressQueries';

export function useUserStore() {
  const { data, isLoading, hasSession } = useProgressQuery();
  const user = toUserData(data);
  const profile = useProfileActions();
  const missions = useMissionActions(user.level);
  const inventory = useInventoryActions();
  return {
    user, isLoading, hasSession,
    ...profile, ...missions, ...inventory,
    archetypeName: getArchetypeStyle(user.archetype).name,
  };
}
