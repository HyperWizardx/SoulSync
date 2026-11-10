/** Ficha opcional del participante (auditoría de equidad): consultar, guardar y borrar. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { deleteMyParticipantProfile, getParticipantProfile, saveMyParticipantProfile } from "@/service/server-functions/participant.functions";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";
import type { ParticipantProfile } from "@/domain/research/participant";

const KEY = ["participant-profile"];
const asProfile = (p: unknown): ParticipantProfile | null =>
  p && typeof p === "object" && "ageBand" in p ? (p as ParticipantProfile) : null;

export function useParticipantProfile(enabled: boolean) {
  const qc = useQueryClient();
  const { hasSession } = useAuthSession();
  const getFn = useServerFn(getParticipantProfile);
  const saveFn = useServerFn(saveMyParticipantProfile);
  const deleteFn = useServerFn(deleteMyParticipantProfile);
  const query = useQuery({ queryKey: KEY, queryFn: async () => asProfile(await getFn()), enabled: hasSession && enabled, staleTime: 5 * 60_000 });
  const save = useMutation({
    mutationFn: (p: ParticipantProfile) => saveFn({ data: p }),
    onSuccess: (p) => { qc.setQueryData(KEY, asProfile(p)); toast.success("¡Gracias! Tu ficha ayuda a que la brújula sea justa para todos."); },
    onError: (e) => toast.error(e instanceof Error && e.message ? e.message : "No se pudo guardar tu ficha."),
  });
  const remove = useMutation({
    mutationFn: () => deleteFn(),
    onSuccess: () => { qc.setQueryData(KEY, null); toast("Tu ficha se borró."); },
    onError: () => toast.error("No se pudo borrar tu ficha."),
  });
  return { ...query, save, remove };
}
