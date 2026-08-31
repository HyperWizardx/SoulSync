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

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { user } = useUserStore();
  const { data: wb, isLoading: wbLoading, checkin } = useWellbeing();
  const archStyle = getArchetypeStyle(user.archetype);

  return <MobileLayout><div className="px-4 pt-6">
    <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Bienvenido de vuelta</p><h1 className="text-xl font-cinzel font-bold text-foreground">{user.name} {archStyle.emoji}</h1></div><Link to="/profile" className="flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-primary/30"><AvatarIcon index={user.avatar} size={44} /></Link></div>
    <div className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-card p-4"><AvatarHero index={user.avatar} mood={computeMood(user.stats)} size={176} /></div>
    <div className="mt-4"><DailyGoalCard /></div>
    <Link to="/world" className="mt-4 block rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Tu Mundo Emocional</p><p className="font-cinzel font-semibold">Valle de la Calma</p></div><ChevronRight className="h-5 w-5" /></div></Link>
    <div className="mt-6"><h2 className="font-cinzel font-semibold">Tu estado integral</h2><p className="mt-1 text-xs text-muted-foreground">Tus estadísticas, tu señal preventiva y tu actividad, en un solo lugar.</p><div className="mt-3"><IntegratedStatus stats={user.stats} missionHistory={user.missionHistory} isLoading={wbLoading} consentAccepted={wb?.consent.accepted ?? false} todayCheckin={wb?.todayCheckin ?? null} prediction={wb?.prediction ?? null} checkinPending={checkin.isPending} onCheckin={(v) => checkin.mutate(v)} /></div></div>
    <div className="mt-6 grid grid-cols-3 gap-2"><div className="flex items-center justify-center gap-1 rounded-xl border border-soul-gold/30 bg-soul-gold/5 p-2"><Flame className="h-4 w-4 text-soul-gold" /><span className="text-sm font-bold text-soul-gold">{user.streak}d</span></div><div className="rounded-xl border border-border bg-card p-2 text-center"><p className="text-[10px] text-muted-foreground">Monedas</p><p className="text-sm font-bold">{user.coins}</p></div><div className="rounded-xl border border-border bg-card p-2 text-center"><p className="text-[10px] text-muted-foreground">Gemas</p><p className="text-sm font-bold text-primary">{user.gems}</p></div></div>
  </div></MobileLayout>;
}
