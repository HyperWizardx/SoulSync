import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileLayout } from "@/presentation/components/layout/MobileLayout";
import { ChevronRight } from "lucide-react";
import { ResourceBar } from "@/presentation/components/layout/ResourceBar";
import { useUserStore } from "@/presentation/hooks/useUserStore";
import { useWellbeing } from "@/presentation/hooks/useWellbeing";
import { MiniAvatar3D } from "@/presentation/components/layout/MiniAvatar3D";
import { PageSkeleton } from "@/presentation/components/layout/PageSkeleton";
import { NextStepCard } from "@/presentation/components/layout/NextStepCard";
import { useDailyGreeting } from "@/presentation/hooks/useDailyGreeting";
import { ArchetypeCrest } from "@/presentation/components/avatars/ArchetypeCrest";
import { Reveal } from "@/presentation/components/motion/Reveal";
import { AuraHalo } from "@/presentation/components/avatars/AuraHalo";
import { CATEGORY_LABEL, getArchetypeStyle } from "@/domain/identity/archetype";
import { DailyGoalCard } from "@/presentation/components/layout/DailyGoalCard";
import { ActivityCard } from "@/presentation/components/wellbeing/ActivityCard";
import { SupportBanner } from "@/presentation/components/wellbeing/SupportSheet";
import { supportReasons } from "@/domain/wellbeing/support";
import { IntegratedStatus } from "@/presentation/components/wellbeing/IntegratedStatus";
import { SEASON_COPY } from "@/domain/world/world";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Tu progreso diario | SoulSync" },
      {
        name: "description",
        content:
          "Tu campamento en SoulSync: tu héroe, tu siguiente misión, tu racha y tu brújula de bienestar.",
      },
      { property: "og:title", content: "Tu progreso diario | SoulSync" },
      {
        property: "og:description",
        content: "Tu héroe, tu siguiente misión y tu brújula de bienestar en SoulSync.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});


function DashboardPage() {
  const { user, isLoading } = useUserStore();
  const { data: wb, isLoading: wbLoading } = useWellbeing();
  const greeting = useDailyGreeting();
  const archStyle = getArchetypeStyle(user.archetype);

  const world = wb?.world ?? null;
  const today = new Date().toDateString();
  const completedToday = useMemo(() => new Set(user.missionHistory.filter((m) => m.date === today).map((m) => m.id)), [user.missionHistory, today]);
  const activeZone = world?.zones.filter((z) => z.unlocked).sort((a, b) => b.progress - a.progress)[0] ?? null;

  if (isLoading) return <MobileLayout><PageSkeleton variant="dashboard" /></MobileLayout>;

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tu aventura continúa</p>
            <h1 className="text-xl font-cinzel font-bold text-foreground">
              {user.name} <GameIcon name={archStyle.icon} className="h-5 w-5 align-[-3px]" style={{ color: archStyle.accent }} />
            </h1>
          </div>
          <ArchetypeCrest archetype={user.archetype} level={user.level} />
        </div>

        <ResourceBar streak={user.streak} coins={user.coins} gems={user.gems} className="mt-4" />

        {/* Protocolo de apoyo: visible en el campamento cuando la brújula o el pergamino lo sugieren */}
        {supportReasons({ riskLevel: wb?.prediction?.riskLevel, safetyFlags: wb?.prediction?.safetyFlags, lastScale: wb?.lastScale }).length > 0 && (
          <div className="mt-4"><SupportBanner /></div>
        )}

        <Reveal index={0} className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-card p-4">
          <AuraHalo aura={wb?.aura} color={archStyle.glow} showLabel={false}>
            <MiniAvatar3D archetype={user.archetype} size={176} glowColor={archStyle.glow} exposure={archStyle.exposure} celebrating={greeting} />
          </AuraHalo>
          <p className="mt-2 font-cinzel font-semibold">{archStyle.name}</p>
          {archStyle.trait && <p className="text-xs text-muted-foreground">{archStyle.trait}</p>}
          {archStyle.affinity.length > 0 && (
            <p className="mt-2 rounded-full bg-soul-gold/10 px-3 py-1 text-center text-xs text-soul-gold">
              Misiones afines: {archStyle.affinity.map((c) => CATEGORY_LABEL[c]).join(" y ")}
            </p>
          )}
          {wb?.aura && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Aura {wb.aura.name}</span> · {wb.aura.message}
            </p>
          )}
        </Reveal>

        <Reveal index={1} className="mt-4">
          <NextStepCard zones={world?.zones ?? null} completedToday={completedToday} level={user.level} archetype={user.archetype} />
        </Reveal>

        <Reveal index={2} className="mt-4">
          <DailyGoalCard />
        </Reveal>

        <Reveal index={2} className="mt-4">
          <ActivityCard />
        </Reveal>

        <Reveal index={3}>
        <Link to="/world" className="mt-4 block rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tu Mundo</p>
              <p className="font-cinzel font-semibold">
                {world ? SEASON_COPY[world.season].label : "Tierras por despertar"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeZone
                  ? `${activeZone.name} · ${activeZone.progress}%`
                  : "Completa una misión para activar tus zonas"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </div>
        </Link>
        </Reveal>

        <Reveal index={4} className="mt-6">
          <h2 className="font-cinzel font-semibold">Estado de tu héroe</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Crece con cada misión, tu racha y tus check-ins del día.
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
        </Reveal>
      </div>
    </MobileLayout>
  );
}
