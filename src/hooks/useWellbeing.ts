import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getWellbeing, saveCheckin, setResearchConsent } from "@/lib/wellbeing.functions";
import type { WellbeingPayload } from "@/lib/wellbeing.functions";

export function useWellbeing() {
  const qc = useQueryClient();
  const fetchWellbeing = useServerFn(getWellbeing);
  const checkinFn = useServerFn(saveCheckin);
  const consentFn = useServerFn(setResearchConsent);

  const query = useQuery<WellbeingPayload>({
    queryKey: ["wellbeing"],
    queryFn: () => fetchWellbeing(),
    staleTime: 60_000,
  });

  const setPayload = (data: WellbeingPayload) => qc.setQueryData(["wellbeing"], data);

  const checkin = useMutation({
    mutationFn: (data: {
      mood: number;
      stress: number;
      energy: number;
      social: number;
      sleepHours?: number | null;
    }) => checkinFn({ data }),
    onSuccess: (data) => {
      setPayload(data);
      toast.success("Check-in registrado", { icon: "📝" });
    },
    onError: () => toast.error("No se pudo guardar tu check-in"),
  });

  const consent = useMutation({
    mutationFn: (data: { accepted: boolean; wearablesOptIn?: boolean }) => consentFn({ data }),
    onSuccess: (data, vars) => {
      setPayload(data);
      toast.success(vars.accepted ? "Consentimiento registrado" : "Consentimiento revocado y datos eliminados");
    },
    onError: () => toast.error("No se pudo actualizar tu consentimiento"),
  });

  return { ...query, checkin, consent };
}
