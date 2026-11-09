// Pantalla Logros: mismo formato que la Tienda (tarjetas en dos columnas agrupadas por sección),
// para que en el móvil se vean más logros sin desplazarse tanto. El progreso es el real del servidor.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Coins, Gem, Trophy } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { MobileLayout } from "@/presentation/components/layout/MobileLayout";
import { BackButton } from "@/presentation/components/layout/BackButton";
import { PageSkeleton } from "@/presentation/components/layout/PageSkeleton";
import { useProfileSummary, useUserStore } from "@/presentation/hooks/useUserStore";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_GROUPS,
  REWARD_BY_RARITY,
  RARITY_CLASSES,
  RARITY_LABEL,
  achievementProgress,
  type Achievement,
  type AchievementContext,
} from "@/domain/gamification/achievements";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Logros | SoulSync" },
      { name: "description", content: "Las hazañas de tu héroe en SoulSync y las recompensas que te esperan." },
      { property: "og:title", content: "Logros | SoulSync" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AchievementsPage,
});

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "pendientes", label: "Pendientes" },
  { key: "desbloqueados", label: "Desbloqueados" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

function AchievementsPage() {
  const { user, isLoading } = useUserStore();
  const { data: summary } = useProfileSummary();
  const [filter, setFilter] = useState<Filter>("todos");
  const unlocked = new Set(user.achievements);
  const ctx = (summary?.context as AchievementContext | undefined) ?? null;
  const progressOf = (a: Achievement) => (ctx ? achievementProgress(a, ctx) : { value: 0, target: a.target, ratio: 0 });

  // El logro pendiente más cercano: lo que conviene perseguir ahora.
  const next = ACHIEVEMENTS.filter((a) => !unlocked.has(a.code))
    .map((a) => ({ a, ratio: progressOf(a).ratio }))
    .sort((x, y) => y.ratio - x.ratio)[0]?.a;

  const visible = (a: Achievement) =>
    filter === "todos" ? true : filter === "desbloqueados" ? unlocked.has(a.code) : !unlocked.has(a.code);

  if (isLoading) return <MobileLayout><PageSkeleton variant="profile" /></MobileLayout>;

  const renderCard = (a: Achievement) => {
    const isUnlocked = unlocked.has(a.code);
    const prog = progressOf(a);
    const reward = REWARD_BY_RARITY[a.rarity];
    const cls = RARITY_CLASSES[a.rarity];
    return (
      <div
        key={a.code}
        className={`flex flex-col rounded-xl border bg-card p-3 transition-all duration-300 ${isUnlocked ? `${cls.border} ${cls.glow}` : "border-border"}`}
      >
        <div className="flex items-center justify-between">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${isUnlocked ? "bg-soul-gold/10 text-soul-gold" : "bg-secondary text-muted-foreground"}`}>
            <GameIcon name={a.icon} className="h-7 w-7" />
          </span>
          <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${cls.badge}`}>{RARITY_LABEL[a.rarity]}</span>
        </div>
        <p className={`mt-2 text-sm font-semibold ${isUnlocked ? "text-foreground" : "text-foreground/80"}`}>{a.name}</p>
        <p className="text-xs text-muted-foreground">{a.description}</p>

        <div className="mt-auto pt-2">
          {isUnlocked ? (
            <p className="flex items-center gap-1 text-xs font-medium text-soul-teal"><Check className="h-3.5 w-3.5" aria-hidden /> Desbloqueado</p>
          ) : (
            <>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${prog.ratio * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{prog.value}/{prog.target}</p>
            </>
          )}
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-soul-gold">
            <span>+{reward.xp} XP</span>
            <span className="flex items-center gap-0.5"><Coins className="h-3 w-3" aria-hidden />{reward.coins}</span>
            {reward.gems > 0 && <span className="flex items-center gap-0.5 text-primary"><Gem className="h-3 w-3" aria-hidden />{reward.gems}</span>}
          </p>
        </div>
      </div>
    );
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-6">
        <div className="flex items-center gap-1">
          <BackButton fallback="/profile" />
          <h1 className="text-2xl font-cinzel font-bold text-foreground">Logros</h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Cada hazaña de tu aventura tiene su recompensa. ¡A por todas!
        </p>

        <div className="mt-4 flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card p-3">
            <Trophy className="h-5 w-5 text-soul-gold" aria-hidden />
            <div>
              <p className="text-lg font-bold text-foreground">{unlocked.size}/{ACHIEVEMENTS.length}</p>
              <p className="text-xs text-muted-foreground">Desbloqueados</p>
            </div>
          </div>
          {next && (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
              <GameIcon name={next.icon} className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{next.name}</p>
                <p className="text-xs text-muted-foreground">Próximo · {progressOf(next).value}/{next.target}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex rounded-xl bg-card p-1" role="tablist" aria-label="Filtrar logros">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`min-h-9 flex-1 rounded-lg text-xs font-semibold ${filter === f.key ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!ACHIEVEMENTS.some(visible) && (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {filter === "desbloqueados" ? "Aún no tienes logros. Completa tu primera misión para conseguir el primero." : "¡Desbloqueaste todos los logros!"}
            </p>
          </div>
        )}

        {ACHIEVEMENT_GROUPS.map((g) => {
          const items = ACHIEVEMENTS.filter((a) => a.group === g.key && visible(a));
          if (items.length === 0) return null;
          const done = ACHIEVEMENTS.filter((a) => a.group === g.key && unlocked.has(a.code)).length;
          const total = ACHIEVEMENTS.filter((a) => a.group === g.key).length;
          return (
            <section key={g.key}>
              <h2 className="mt-6 text-sm font-semibold text-foreground">
                {g.label} <span className="text-xs font-normal text-muted-foreground">({done}/{total})</span>
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-3">{items.map(renderCard)}</div>
            </section>
          );
        })}
      </div>
    </MobileLayout>
  );
}
