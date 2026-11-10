/** "Elegidas para ti": recomendaciones del recomendador propio (cambian una vez al día). */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRecommendations, type RecommendationsPayload } from "@/service/server-functions/recommendations.functions";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";

export function useRecommendations() {
  const fn = useServerFn(getRecommendations);
  const { hasSession } = useAuthSession();
  return useQuery<RecommendationsPayload>({
    queryKey: ["recommendations"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
    enabled: hasSession,
    retry: false,
  });
}
