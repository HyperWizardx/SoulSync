/** "Elegidas para ti": recomendaciones del recomendador propio y el voto "¿Te sirvió?". */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRecommendations, sendMissionFeedback, type RecommendationsPayload } from "@/service/server-functions/recommendations.functions";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";

/** reroll: 0 = las del día (estables); cada "Otras opciones" pide otra muestra. */
export function useRecommendations(reroll = 0) {
  const fn = useServerFn(getRecommendations);
  const { hasSession } = useAuthSession();
  return useQuery<RecommendationsPayload>({
    queryKey: ["recommendations", reroll],
    queryFn: () => fn({ data: { reroll } }),
    staleTime: 5 * 60_000,
    enabled: hasSession,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

/** Guarda el voto y refresca lo aprendido (la siguiente recomendación ya lo tiene en cuenta). */
export function useMissionFeedback() {
  const fn = useServerFn(sendMissionFeedback);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { missionId: string; helpful: boolean }) => fn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations"] }),
  });
}
