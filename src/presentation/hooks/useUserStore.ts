/** Fachada compatible del estado del usuario: compone lectura y acciones por responsabilidad. */
import { AVATAR_META } from '@/presentation/components/avatars/AvatarArt';
import { toUserData } from './user/userState';
import { useProgressQuery } from './user/useProgressQueries';
import { useProfileActions } from './user/useProfileActions';
import { useMissionActions } from './user/useMissionActions';
import { useInventoryActions } from './user/useInventoryActions';
export type { UserStats, UserAttributes, TaskCategoryName, MissionReward, UserSettings, UserData } from './user/userState';
export { useProfileSummary, useWeeklyStats } from './user/useProgressQueries';

const ARCHETYPES = ['Guerrero', 'Sanador', 'Explorador', 'Sabio'];
export function useUserStore() {
  const { data, isLoading, hasSession } = useProgressQuery();
  const user = toUserData(data);
  const profile = useProfileActions();
  const missions = useMissionActions(user.level);
  const inventory = useInventoryActions();
  return {
    user, isLoading, hasSession,
    ...profile, ...missions, ...inventory,
    avatarMeta: AVATAR_META[user.avatar] ?? AVATAR_META[0],
    archetypeName: user.archetype !== null ? ARCHETYPES[user.archetype] : 'Novato',
  };
}
