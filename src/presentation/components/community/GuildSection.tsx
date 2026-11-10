// Gremio en Comunidad: fundar o unirse con código y, ya dentro, el reto semanal compartido
// (progreso colectivo, sin ranking) con su cofre. Todo suma con las misiones del catálogo.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, LogOut, Share2, Users } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useGuild } from "@/presentation/hooks/useGuild";
import { GUILD_CHEST, GUILD_EMBLEMS, GUILD_MAX, MISSIONS_PER_MEMBER } from "@/domain/community/guilds";
import { CATEGORY_LABEL, getArchetypeStyle, isAffine } from "@/domain/identity/archetype";
import type { GuildView } from "@/service/server-functions/guild.functions";

export function GuildSection({ archetype }: { archetype: number | null }) {
  const { data: guild, isLoading } = useGuild();
  return (
    <section className="mt-5" aria-labelledby="guild-title">
      <div className="flex items-center justify-between">
        <h2 id="guild-title" className="font-cinzel font-semibold text-foreground">Tu gremio</h2>
        {guild && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" aria-hidden />{guild.members.length}/{GUILD_MAX} héroes</span>}
      </div>
      {isLoading ? (
        <div className="mt-3 h-40 animate-pulse rounded-2xl border border-border bg-card" />
      ) : guild ? (
        <GuildCard guild={guild} archetype={archetype} />
      ) : (
        <NoGuild />
      )}
    </section>
  );
}

function NoGuild() {
  const { found, join } = useGuild();
  const [mode, setMode] = useState<"fundar" | "unirse">("unirse");
  const [name, setName] = useState("");
  const [emblem, setEmblem] = useState<string>(GUILD_EMBLEMS[0].key);
  const [code, setCode] = useState("");
  const busy = found.isPending || join.isPending;

  return (
    <div className="mt-3 rounded-2xl border border-soul-gold/30 bg-gradient-to-br from-soul-gold/10 via-card to-primary/5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-soul-gold/15 text-soul-gold">
          <GameIcon name="flying-flag" className="h-7 w-7" />
        </span>
        <div>
          <p className="font-cinzel font-semibold text-foreground">Reúne a tu gremio</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Junta de 3 a {GUILD_MAX} héroes y superen un reto cada semana. Aquí nadie compite: cada misión suma para todos.
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Fundar o unirse" className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
        {([["unirse", "Tengo un código"], ["fundar", "Fundar gremio"]] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
            className={`min-h-9 rounded-lg text-xs font-semibold transition-colors ${mode === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === "unirse" ? (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); join.mutate(code); }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            placeholder="CÓDIGO"
            aria-label="Código del gremio"
            autoCapitalize="characters"
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-center font-mono text-lg tracking-[0.35em] text-foreground outline-none focus:border-primary"
          />
          <button disabled={busy || code.length !== 6} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            Unirme
          </button>
        </form>
      ) : (
        <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); found.mutate({ name, emblem }); }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 30))}
            placeholder="Nombre del gremio"
            aria-label="Nombre del gremio"
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
          <fieldset>
            <legend className="mb-1.5 text-xs text-muted-foreground">Elige su estandarte</legend>
            <div className="grid grid-cols-6 gap-1.5">
              {GUILD_EMBLEMS.map((e) => (
                <button type="button" key={e.key} onClick={() => setEmblem(e.key)} aria-pressed={emblem === e.key} aria-label={e.label} title={e.label}
                  className={`flex aspect-square items-center justify-center rounded-xl border transition-colors ${emblem === e.key ? "border-soul-gold bg-soul-gold/15 text-soul-gold" : "border-border bg-card text-muted-foreground"}`}>
                  <GameIcon name={e.icon} className="h-6 w-6" />
                </button>
              ))}
            </div>
          </fieldset>
          <button disabled={busy || name.trim().length < 3} className="min-h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
            Fundar gremio
          </button>
        </form>
      )}
    </div>
  );
}

function GuildCard({ guild, archetype }: { guild: GuildView; archetype: number | null }) {
  const { openChest, leave } = useGuild();
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const c = guild.challenge;
  const catLabel = CATEGORY_LABEL[c.category];
  const affine = isAffine(archetype, c.category);
  const archName = getArchetypeStyle(archetype).name;

  const invite = async () => {
    const text = `Únete a mi gremio "${guild.name}" en SoulSync con el código ${guild.code}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Mi gremio en SoulSync", text }); return; }
      await navigator.clipboard.writeText(guild.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* el usuario canceló */ }
  };

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-soul-gold/30 bg-card">
      {/* Estandarte y código para invitar */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-soul-gold/15 via-card to-card p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-soul-gold/40 bg-soul-gold/15 text-soul-gold">
          <GameIcon name={guild.emblemIcon} className="h-9 w-9" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-cinzel text-lg font-bold text-foreground">{guild.name}</p>
          <button onClick={invite} className="mt-0.5 flex min-h-8 items-center gap-1.5 rounded-lg text-xs text-muted-foreground" aria-label={`Invitar con el código ${guild.code}`}>
            Código <span className="font-mono font-semibold tracking-widest text-foreground">{guild.code}</span>
            {copied ? <Check className="h-3.5 w-3.5 text-soul-teal" aria-hidden /> : typeof navigator !== "undefined" && "share" in navigator ? <Share2 className="h-3.5 w-3.5 text-primary" aria-hidden /> : <Copy className="h-3.5 w-3.5 text-primary" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Miembros: solo nombre, arquetipo y nivel */}
      <ul className="flex flex-wrap gap-1.5 px-4 pt-3" aria-label="Miembros del gremio">
        {guild.members.map((m, i) => {
          const s = getArchetypeStyle(m.archetype);
          return (
            <li key={i} className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs ${m.isMe ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-secondary/60 text-foreground"}`}>
              <GameIcon name={s.icon} className="h-3.5 w-3.5" style={{ color: s.accent }} />
              <span className="max-w-[7rem] truncate">{m.isMe ? "Tú" : m.name}</span>
              <span className="text-muted-foreground">Nv {m.level}</span>
            </li>
          );
        })}
        {Array.from({ length: GUILD_MAX - guild.members.length }).map((_, i) => (
          <li key={`free-${i}`} className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">Libre</li>
        ))}
      </ul>

      {/* Reto de la semana */}
      <div className="m-4 rounded-xl border border-border bg-secondary/40 p-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GameIcon name={c.icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reto de la semana · {catLabel}</p>
            <p className="font-semibold text-foreground">{c.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
            {affine && <p className="mt-1 text-xs font-semibold text-soul-gold">Afín a tu {archName}: tus misiones dan +20 % XP</p>}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-foreground">{Math.min(c.done, c.target)} de {c.target} misiones</span>
            <span className="text-muted-foreground">{c.contributors} de {guild.members.length} han aportado</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuemin={0} aria-valuemax={c.target} aria-valuenow={Math.min(c.done, c.target)} aria-label="Progreso del gremio">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-soul-gold transition-[width] duration-700" style={{ width: `${c.percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {c.mine > 0 ? `Tus misiones ya suman ${c.mine}. ` : ""}Meta: {MISSIONS_PER_MEMBER} por héroe, hasta el domingo.
          </p>
        </div>

        {!c.active ? (
          <div className="mt-3 rounded-lg bg-primary/10 p-2.5 text-xs text-foreground">
            {c.missingMembers === 1 ? "Falta 1 héroe" : `Faltan ${c.missingMembers} héroes`} para activar el reto y su cofre. ¡Comparte el código!
            <button onClick={invite} className="mt-2 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              <Share2 className="h-3.5 w-3.5" aria-hidden /> Invitar al gremio
            </button>
          </div>
        ) : c.canClaim ? (
          <button onClick={() => openChest.mutate()} disabled={openChest.isPending}
            className="mt-3 flex min-h-12 w-full flex-col items-center justify-center rounded-xl bg-soul-gold py-1.5 text-background disabled:opacity-60">
            <span className="flex items-center gap-2 text-sm font-bold"><GameIcon name="open-treasure-chest" className="h-5 w-5" /> Abrir cofre del gremio</span>
            <span className="text-xs font-semibold opacity-80">+{GUILD_CHEST.coins} monedas · +{GUILD_CHEST.gems} gemas</span>
          </button>
        ) : c.claimed ? (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-soul-teal/10 p-2.5 text-xs font-semibold text-soul-teal">
            <GameIcon name="open-treasure-chest" className="h-4 w-4" /> ¡Cofre abierto! El gremio superó el reto de esta semana.
          </p>
        ) : c.completed ? (
          <Link to="/missions" search={{ cat: c.category }} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-soul-gold/50 bg-soul-gold/10 text-sm font-semibold text-soul-gold">
            <GameIcon name="locked-chest" className="h-5 w-5" /> Completa una misión de {catLabel.toLowerCase()} para abrir tu cofre
          </Link>
        ) : (
          <Link to="/missions" search={{ cat: c.category }} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
            Sumar misiones de {catLabel.toLowerCase()}
          </Link>
        )}
      </div>

      <div className="flex justify-end px-4 pb-3">
        {confirmLeave ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">¿Dejar el gremio?</span>
            <button onClick={() => leave.mutate()} disabled={leave.isPending} className="min-h-8 rounded-lg bg-destructive/15 px-2.5 font-semibold text-destructive">Sí, salir</button>
            <button onClick={() => setConfirmLeave(false)} className="min-h-8 rounded-lg px-2.5 text-muted-foreground">Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setConfirmLeave(true)} className="flex min-h-8 items-center gap-1 text-xs text-muted-foreground">
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Salir del gremio
          </button>
        )}
      </div>
    </div>
  );
}
