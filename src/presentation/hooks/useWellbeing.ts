import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { withTimeout } from "@/presentation/components/common/QueryStatus";
import { getWellbeing, logTaskEvent, saveCheckin, setResearchConsent, setWritingShare, submitWho5 } from "@/service/server-functions/wellbeing.functions";
import { emitFeedback } from "@/shared/feedback";
import type { WellbeingPayload } from "@/service/server-functions/wellbeing.functions";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";

export function useWellbeing() {
  const qc = useQueryClient();
  const fetchWellbeing = useServerFn(getWellbeing);
  const checkinFn = useServerFn(saveCheckin);
  const consentFn = useServerFn(setResearchConsent);
  const taskEventFn = useServerFn(logTaskEvent);
  const who5Fn = useServerFn(submitWho5);
  const { hasSession } = useAuthSession();

  const query = useQuery<WellbeingPayload>({
    queryKey: ["wellbeing"],
    queryFn: () => withTimeout(fetchWellbeing()),
    staleTime: 60_000,
    retry: 1,
    // Sin sesión no se consulta: evita una petición 401 mientras se comprueba el inicio de sesión.
    enabled: hasSession,
  });

  const setPayload = (data: WellbeingPayload) => qc.setQueryData(["wellbeing"], data);

  const checkin = useMutation({
    mutationFn: (data: {
      mood: number;
      stress: number;
      energy: number;
      social: number;
      sleepHours?: number | null;
      localHour?: number;
      responseSeconds?: number;
    }) => checkinFn({ data }),
    onSuccess: (data) => {
      setPayload(data);
      toast.success("Check-in registrado");
    },
    onError: () => toast.error("No se pudo guardar tu check-in"),
  });

  const consent = useMutation({
    mutationFn: (data: { accepted: boolean; wearablesOptIn?: boolean; shareWriting?: boolean }) => consentFn({ data }),
    onSuccess: (data, vars) => {
      setPayload(data);
      toast.success(vars.accepted ? "Consentimiento registrado" : "Consentimiento revocado y datos eliminados");
    },
    onError: () => toast.error("No se pudo actualizar tu consentimiento"),
  });

  const shareFn = useServerFn(setWritingShare);
  const writingShare = useMutation({
    mutationFn: (share: boolean) => shareFn({ data: { share } }),
    onSuccess: (data, share) => {
      setPayload(data);
      toast.success(share ? "Tus escritos se compartirán con el equipo de psicología" : "Tus escritos quedan solo para ti");
    },
    onError: () => toast.error("No se pudo actualizar tu preferencia"),
  });

  const logTask = useMutation({
    mutationFn: (data: {
      missionId: string;
      title: string;
      status: "assigned" | "started" | "completed" | "skipped";
      category?: "autocuidado" | "reflexion" | "movimiento" | "social" | "cognitivo" | "ar";
      durationSeconds?: number;
      isAR?: boolean;
    }) =>
      taskEventFn({
        data: {
          missionId: data.missionId,
          title: data.title,
          status: data.status,
          category: data.category ?? "autocuidado",
          durationSeconds: data.durationSeconds ?? 0,
          isAR: data.isAR ?? false,
        },
      }),
    onSuccess: (data) => setPayload(data),
  });

  // Pergamino del bienestar (WHO-5): guarda, actualiza la brújula y celebra logros nuevos.
  const who5 = useMutation({
    mutationFn: (answers: number[]) => who5Fn({ data: { answers } }),
    onSuccess: ({ unlockedAchievements, ...data }) => {
      setPayload(data);
      toast.success("¡Pergamino del bienestar sellado!");
      for (const code of unlockedAchievements) emitFeedback({ type: "achievement", code });
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["profile-summary"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo guardar tu pergamino"),
  });

  return { ...query, checkin, consent, logTask, who5, writingShare };
}
