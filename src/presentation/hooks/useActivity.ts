/** Actividad física de la semana (meta OMS de 150 min): consulta y registro. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getActivityWeek, logActivity, type ActivityPayload } from "@/service/server-functions/activity.functions";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";
import { emitFeedback } from "@/shared/feedback";
import type { Intensity } from "@/domain/wellbeing/activity";

/** Fecha local del teléfono (YYYY-MM-DD): la semana y el día son los del estudiante. */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useActivity() {
  const qc = useQueryClient();
  const { hasSession } = useAuthSession();
  const getFn = useServerFn(getActivityWeek);
  const logFn = useServerFn(logActivity);
  const today = localToday();
  const key = ["activity-week", today];

  const query = useQuery<ActivityPayload>({
    queryKey: key,
    queryFn: () => getFn({ data: { today } }),
    staleTime: 60_000,
    enabled: hasSession,
  });

  const log = useMutation({
    mutationFn: (v: { minutes: number; intensity: Intensity; strength: boolean }) => logFn({ data: { today, ...v } }),
    onSuccess: ({ unlockedAchievements, ...data }) => {
      const wasMet = query.data?.week.goalMet ?? false;
      qc.setQueryData(key, data);
      if (!wasMet && data.week.goalMet) toast.success("¡Meta OMS de la semana cumplida: 150 minutos!");
      else toast.success("Actividad registrada");
      for (const code of unlockedAchievements) emitFeedback({ type: "achievement", code });
      if (unlockedAchievements.length) qc.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: () => toast.error("No se pudo guardar tu actividad"),
  });

  return { ...query, log };
}
