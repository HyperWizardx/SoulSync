import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { ChevronRight, Flame } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";
import { useWellbeing } from "@/hooks/useWellbeing";
import { AvatarIcon } from "@/components/avatars/AvatarArt";
import { AvatarHero, computeMood } from "@/components/avatars/AvatarHero";
import { getArchetypeStyle } from "@/lib/archetype";
import { DailyGoalCard } from "@/components/DailyGoalCard";
import { IntegratedStatus } from "@/components/wellbeing/IntegratedStatus";
import { SEASON_COPY } from "@/lib/wellbeing/world";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Tu progreso diario | SoulSync" },
      {
        name: "description",
        content:
          "Resumen de tu avance en SoulSync: métricas derivadas de tus misiones completadas, tu racha y tu señal preventiva de bienestar.",
      },
      { property: "og:title", content: "Tu progreso diario | SoulSync" },
      {
        property: "og:description",
        content: "Métricas reales de bienestar calculadas con tu actividad diaria en SoulSync.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useUserStore();
  const { data: wb, isLoading: wbLoading } = useWellbeing();
  const archStyle = getArchetypeStyle(user.archetype);

  const world = wb?.world ?? null;
  const activeZone = world?.zones.filter((z) => z.unlocked).sort((a, b) => b.progress - a.progress)[0] ?? null;

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bienvenido de vuelta</p>
            <h1 className="text-xl font-cinzel font-bold text-foreground">
              {user.name} {archStyle.emoji}
            </h1>
          </div>
          <Link to="/profile" className="flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-primary/30">
            <AvatarIcon index={user.avatar} size={44} />
          </Link>
        </div>

        <div className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-card p-4">
          <AvatarHero index={user.avatar} mood={computeMood(user.stats)} size={176} />
        </div>

        <div className="mt-4">
          <DailyGoalCard />
        </div>

        <Link to="/world" className="mt-4 block rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tu Mundo Emocional</p>
              <p className="font-cinzel font-semibold">
                {world ? SEASON_COPY[world.season].label : "Aún sin datos"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {activeZone
                  ? `${activeZone.emoji} ${activeZone.name} · ${activeZone.progress}%`
                  : "Completa una misión para activar tus zonas"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </div>
        </Link>

        <div className="mt-6">
          <h2 className="font-cinzel font-semibold">Tu estado integral</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Calculado con tus misiones completadas, tu racha y tus check-ins recientes.
          </p>
          <div className="mt-3">
            <IntegratedStatus
              missionHistory={user.missionHistory}
              checkins={wb?.checkins ?? []}
              streak={user.streak}
              dailyGoal={user.settings.dailyGoal}
              isLoading={wbLoading}
              consentAccepted={wb?.consent.accepted ?? false}
              todayCheckin={wb?.todayCheckin ?? null}
              prediction={wb?.prediction ?? null}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="flex items-center justify-center gap-1 rounded-xl border border-soul-gold/30 bg-soul-gold/5 p-2">
            <Flame className="h-4 w-4 text-soul-gold" aria-hidden="true" />
            <span className="text-sm font-bold text-soul-gold">{user.streak}d</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Monedas</p>
            <p className="text-sm font-bold">{user.coins}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Gemas</p>
            <p className="text-sm font-bold text-primary">{user.gems}</p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
