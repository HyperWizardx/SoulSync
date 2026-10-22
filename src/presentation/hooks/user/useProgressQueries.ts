/** Lectura del progreso y migración del almacenamiento local antiguo tras obtener sesión. */
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getProgress, migrateLocalProgress, getProfileSummary, getWeeklyStats } from '@/service/server-functions/progress.functions';
import { useAuthSession } from '@/presentation/components/layout/AuthSessionProvider';
const MIGRATED_KEY = 'soulsync_migrated';
export function useProgressQuery() {
  const qc = useQueryClient();
  const getProgressFn = useServerFn(getProgress);
  const migrateFn = useServerFn(migrateLocalProgress);
  const migratedRef = useRef(false);
  const { hasSession } = useAuthSession();
  const { data, isLoading } = useQuery({
    queryKey: ["progress"],
    queryFn: () => getProgressFn(),
    staleTime: 10_000,
    enabled: hasSession,
    retry: false,
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
      })
        .then(() => {
          localStorage.setItem(MIGRATED_KEY, "1");
          localStorage.removeItem("soulsync_user");
          qc.invalidateQueries({ queryKey: ["progress"] });
        })
        .catch(() => {});
    } catch {
      localStorage.setItem(MIGRATED_KEY, "1");
    }
  }, [data, migrateFn, qc]);

  return { data, isLoading, hasSession };
}

export function useProfileSummary() {
  const fn = useServerFn(getProfileSummary);
  const { hasSession } = useAuthSession();
  return useQuery({
    queryKey: ["profile-summary"],
    queryFn: () => fn(),
    staleTime: 30_000,
    enabled: hasSession,
    retry: false,
  });
}

export function useWeeklyStats() {
  const fn = useServerFn(getWeeklyStats);
  const { hasSession } = useAuthSession();
  return useQuery({
    queryKey: ["weekly-stats"],
    queryFn: () => fn(),
    staleTime: 60_000,
    enabled: hasSession,
    retry: false,
  });
}
