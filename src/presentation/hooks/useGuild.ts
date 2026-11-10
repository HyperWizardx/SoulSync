/** Gremio del estudiante: consulta, fundar, unirse, salir y abrir el cofre semanal. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { enterGuild, exitGuild, foundGuild, getMyGuild, openGuildChest, type GuildView } from "@/service/server-functions/guild.functions";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";
import { emitFeedback } from "@/shared/feedback";
import { localToday } from "./useActivity";

/** Solo acepta un gremio bien formado (una sesión vencida no debe romper la pantalla). */
const asGuild = (g: unknown): GuildView | null =>
  g && typeof g === "object" && Array.isArray((g as GuildView).members) ? (g as GuildView) : null;
const errorText = (e: unknown) => (e instanceof Error && e.message ? e.message : "Algo salió mal. Intenta de nuevo.");

export function useGuild() {
  const qc = useQueryClient();
  const { hasSession } = useAuthSession();
  const today = localToday();
  const key = ["guild", today];
  const getFn = useServerFn(getMyGuild);
  const foundFn = useServerFn(foundGuild);
  const enterFn = useServerFn(enterGuild);
  const exitFn = useServerFn(exitGuild);
  const chestFn = useServerFn(openGuildChest);

  const query = useQuery<GuildView | null>({
    queryKey: key,
    queryFn: async () => asGuild(await getFn({ data: { today } })),
    staleTime: 60_000,
    enabled: hasSession,
  });

  const settle = ({ guild, unlockedAchievements = [] }: { guild: GuildView | null; unlockedAchievements?: string[] }) => {
    qc.setQueryData(key, asGuild(guild));
    for (const code of unlockedAchievements) emitFeedback({ type: "achievement", code });
    if (unlockedAchievements.length) qc.invalidateQueries({ queryKey: ["progress"] });
  };

  const found = useMutation({
    mutationFn: (v: { name: string; emblem: string }) => foundFn({ data: { today, ...v } }),
    onSuccess: (r) => { settle(r); toast.success("¡Tu gremio ha sido fundado! Comparte el código con tus compañeros."); },
    onError: (e) => toast.error(errorText(e)),
  });
  const join = useMutation({
    mutationFn: (code: string) => enterFn({ data: { today, code } }),
    onSuccess: (r) => { settle(r); toast.success(`¡Bienvenido a ${r.guild?.name ?? "tu gremio"}!`); },
    onError: (e) => toast.error(errorText(e)),
  });
  const leave = useMutation({
    mutationFn: () => exitFn(),
    onSuccess: () => { qc.setQueryData(key, null); toast("Has dejado el gremio. Puedes unirte a otro cuando quieras."); },
    onError: (e) => toast.error(errorText(e)),
  });
  const openChest = useMutation({
    mutationFn: () => chestFn({ data: { today } }),
    onSuccess: ({ reward, ...r }) => {
      settle(r);
      emitFeedback({ type: "reward", ...reward });
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["profile-summary"] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  return { ...query, found, join, leave, openChest };
}
