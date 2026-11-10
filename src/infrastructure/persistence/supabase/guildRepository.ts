/**
 * Gremios en Lovable Cloud — capa de Infraestructura.
 * Crear, unirse y salir pasan por funciones SQL (validan cupo y código); el progreso colectivo
 * llega sin desglose por persona. Las reglas del reto y del cofre viven en domain/community.
 */
import {
  GUILD_CHEST, canClaimChest, emblemIcon, guildProgress, weeklyChallenge, type GuildProgress, type WeeklyChallenge,
} from "@/domain/community/guilds";
import type { Db } from "./gamificationRepository";

export interface GuildMemberView { name: string; archetype: number | null; level: number; isMe: boolean }
export interface GuildView {
  id: string;
  name: string;
  code: string;
  emblem: string;
  emblemIcon: string;
  members: GuildMemberView[];
  challenge: GuildProgress & {
    title: string;
    description: string;
    icon: string;
    category: WeeklyChallenge["category"];
    weekStart: string;
    /** Héroes que aportaron al menos una misión (sin decir quiénes ni cuántas). */
    contributors: number;
    /** Misiones propias que sumaron al reto esta semana. */
    mine: number;
    claimed: boolean;
    canClaim: boolean;
  };
}

/** Mensaje claro para el estudiante a partir del error de la función SQL. */
function friendly(message: string | undefined, fallback: string): Error {
  const known = ["Ya perteneces a un gremio", "Código de gremio no encontrado", "El gremio ya está completo"];
  return new Error(known.find((k) => message?.includes(k)) ?? fallback);
}

export async function loadGuild(db: Db, userId: string, today: string): Promise<GuildView | null> {
  const { data: membership } = await db.from("guild_members").select("guild_id, joined_at").eq("user_id", userId).maybeSingle();
  if (!membership) return null;
  const challengeDef = weeklyChallenge(today);
  const [guildRes, rosterRes, progressRes, mineRes, claimRes] = await Promise.all([
    db.from("guilds").select("id, name, code, emblem").eq("id", membership.guild_id).maybeSingle(),
    db.rpc("guild_roster"),
    db.rpc("guild_week_progress", { _since: challengeDef.weekStart, _categories: [...challengeDef.counts] }),
    db.from("mission_completions").select("id", { count: "exact", head: true }).eq("user_id", userId)
      .gte("completed_date", challengeDef.weekStart).gte("completed_at", membership.joined_at).in("category", [...challengeDef.counts]),
    db.from("guild_chest_claims").select("week_start").eq("user_id", userId).eq("week_start", challengeDef.weekStart).maybeSingle(),
  ]);
  if (!guildRes.data) return null;
  const roster = rosterRes.data ?? [];
  const progressRow = (progressRes.data ?? [])[0] ?? { total: 0, contributors: 0 };
  const progress = guildProgress(roster.length, Number(progressRow.total));
  const mine = mineRes.count ?? 0;
  const claimed = Boolean(claimRes.data);
  return {
    id: guildRes.data.id,
    name: guildRes.data.name,
    code: guildRes.data.code,
    emblem: guildRes.data.emblem,
    emblemIcon: emblemIcon(guildRes.data.emblem),
    members: roster.map((m) => ({ name: m.name, archetype: m.archetype, level: m.level, isMe: m.user_id === userId })),
    challenge: {
      ...progress,
      title: challengeDef.title,
      description: challengeDef.description,
      icon: challengeDef.icon,
      category: challengeDef.category,
      weekStart: challengeDef.weekStart,
      contributors: Number(progressRow.contributors),
      mine,
      claimed,
      canClaim: canClaimChest(progress, claimed) && mine > 0,
    },
  };
}

export async function createGuild(db: Db, name: string, emblem: string): Promise<string> {
  const { data, error } = await db.rpc("create_guild", { _name: name, _emblem: emblem });
  if (error || !data) throw friendly(error?.message, "No se pudo fundar el gremio. Intenta de nuevo.");
  return data;
}

export async function joinGuild(db: Db, code: string): Promise<void> {
  const { error } = await db.rpc("join_guild", { _code: code });
  if (error) throw friendly(error.message, "No se pudo entrar al gremio. Intenta de nuevo.");
}

export async function leaveGuild(db: Db): Promise<void> {
  const { error } = await db.rpc("leave_guild");
  if (error) throw new Error("No se pudo salir del gremio. Intenta de nuevo.");
}

/** Abre el cofre de la semana: una vez por héroe, si el gremio superó el reto y él aportó. */
export async function claimGuildChest(db: Db, userId: string, today: string): Promise<{ xp: number; coins: number; gems: number }> {
  const guild = await loadGuild(db, userId, today);
  if (!guild) throw new Error("Aún no perteneces a un gremio.");
  if (guild.challenge.claimed) throw new Error("Ya abriste el cofre de esta semana.");
  if (!guild.challenge.completed) throw new Error("El gremio aún no supera el reto de la semana.");
  if (guild.challenge.mine === 0) throw new Error("Completa una misión del reto para abrir tu cofre.");

  const { error } = await db.from("guild_chest_claims").insert({
    user_id: userId, week_start: guild.challenge.weekStart, guild_id: guild.id, coins: GUILD_CHEST.coins, gems: GUILD_CHEST.gems,
  });
  if (error) throw new Error("Ya abriste el cofre de esta semana.");
  const { data: profile } = await db.from("profiles").select("coins, gems").eq("user_id", userId).maybeSingle();
  await db.from("profiles").update({
    coins: (profile?.coins ?? 0) + GUILD_CHEST.coins,
    gems: (profile?.gems ?? 0) + GUILD_CHEST.gems,
  }).eq("user_id", userId);
  return { ...GUILD_CHEST };
}
