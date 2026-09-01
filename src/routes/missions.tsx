import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { useEffect, useMemo, useState } from "react";
import { Lock, Flame, Coins, Gem, Sparkles, Camera } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/hooks/useUserStore";
import { useWellbeing } from "@/hooks/useWellbeing";
import { MISSIONS, MISSION_CATEGORY, getMissionById, type Mission } from "@/lib/missionsData";
import { AvatarIcon } from "@/components/avatars/AvatarArt";
import { BreathingMission } from "@/components/missions/BreathingMission";
import { JournalMission } from "@/components/missions/JournalMission";
import { TimerMission } from "@/components/missions/TimerMission";
import { GratitudeMission } from "@/components/missions/GratitudeMission";
import { QuizMission } from "@/components/missions/QuizMission";
import { ARAuraMission } from "@/components/missions/ARAuraMission";
import { AREnergyMission } from "@/components/missions/AREnergyMission";
import { ARFocusMission } from "@/components/missions/ARFocusMission";
import { MeditationMission } from "@/components/missions/MeditationMission";
import { DailyChallengeMission } from "@/components/missions/DailyChallengeMission";
import { ARWalkMission } from "@/components/missions/ARWalkMission";

export const Route = createFileRoute("/missions")({
  validateSearch: (search: Record<string, unknown>): { mission?: string } => ({
    mission: typeof search.mission === "string" ? search.mission : undefined,
  }),
  component: MissionsPage,
});
const tabs = ["Activas", "AR", "Completadas", "Bloqueadas"] as const;

function MissionsPage() {
  const { user, completeMission } = useUserStore();
  const { logTask } = useWellbeing();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<typeof tabs[number]>("Activas");
  const [active, setActive] = useState<Mission | null>(null);
  const { mission: missionParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  useEffect(() => {
    if (!missionParam) return;
    const m = getMissionById(missionParam);
    if (m && (!m.requiredLevel || user.level >= m.requiredLevel)) setActive(m);
    void navigate({ search: {}, replace: true });
  }, [missionParam, navigate, user.level]);
  const today = new Date().toDateString();
  const completedToday = useMemo(() => new Set(user.missionHistory.filter((m) => m.date === today).map((m) => m.id)), [user.missionHistory, today]);
  const { activas, ar, completadas, bloqueadas } = useMemo(() => {
    const activas: Mission[] = [], ar: Mission[] = [], completadas: Mission[] = [], bloqueadas: Mission[] = [];
    for (const m of MISSIONS) {
      if (m.requiredLevel && user.level < m.requiredLevel) bloqueadas.push(m);
      else if (completedToday.has(m.id)) completadas.push(m);
      else if (m.isAR) ar.push(m); else activas.push(m);
    }
    return { activas, ar, completadas, bloqueadas };
  }, [user.level, completedToday]);
  const skipMission = (m: Mission) => {
    setSkipped((prev) => new Set(prev).add(m.id));
    logTask.mutate({ missionId: m.id, title: m.title, status: "skipped", category: MISSION_CATEGORY[m.type], isAR: m.isAR ?? false });
    toast("Tarea omitida hoy", { icon: "⏭️" });
  };
  const finishMission = async (m: Mission, extraNote?: string) => {
    setActive(null);
    await completeMission(m.id, m.title, m.reward, m.isAR ?? false, { category: MISSION_CATEGORY[m.type] });
    toast.success(`¡${m.title} completada! +${m.reward.xp} XP`, { icon: "🎉", description: extraNote });
  };
  return <MobileLayout><div className="px-4 pt-6">
    <div className="flex items-start justify-between"><div className="flex items-center gap-3"><AvatarIcon index={user.avatar} size={40} /><div><h1 className="text-2xl font-cinzel font-bold">Misiones</h1><p className="mt-1 text-sm text-muted-foreground">Tu camino de crecimiento</p></div></div><div className="flex items-center gap-1 rounded-full border border-soul-gold/30 bg-soul-gold/10 px-2.5 py-1"><Flame className="h-3.5 w-3.5 text-soul-gold" /><span className="text-xs font-bold text-soul-gold">{user.streak}d</span></div></div>
    <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl border border-border bg-card p-2 text-center"><p className="text-[10px] text-muted-foreground">XP</p><p className="text-sm font-bold text-soul-gold">{user.xp}</p></div><div className="flex items-center justify-center gap-1 rounded-xl border border-border bg-card p-2"><Coins className="h-3.5 w-3.5 text-soul-gold" /><span className="text-sm font-bold">{user.coins}</span></div><div className="flex items-center justify-center gap-1 rounded-xl border border-border bg-card p-2"><Gem className="h-3.5 w-3.5 text-primary" /><span className="text-sm font-bold">{user.gems}</span></div></div>
    <div className="mt-5 flex rounded-xl bg-card p-1">{tabs.map((t) => { const count = t === "Activas" ? activas.length : t === "AR" ? ar.length : t === "Completadas" ? completadas.length : bloqueadas.length; return <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-lg py-2 text-[11px] font-semibold ${tab === t ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>{t === "AR" && <Camera className="mr-0.5 inline h-3 w-3" />}{t} <span className="opacity-70">({count})</span></button>; })}</div>
    <div className="mt-4 space-y-3">{tab === "Activas" && (activas.length === 0 ? <EmptyState text="¡Has completado todas las misiones de hoy! Vuelve mañana." /> : activas.map((m) => <MissionCard key={m.id} mission={m} onStart={() => setActive(m)} onSkip={skipped.has(m.id) ? undefined : () => skipMission(m)} skipped={skipped.has(m.id)} />))}
    {tab === "AR" && <>{<div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">✨ Las misiones AR usan la cámara de tu móvil + un mini avatar 3D para experiencias inmersivas.</div>}{ar.length === 0 ? <EmptyState text="Ya completaste las misiones AR de hoy." /> : ar.map((m) => <MissionCard key={m.id} mission={m} onStart={() => setActive(m)} ar />)}</>}
    {tab === "Completadas" && (completadas.length === 0 ? <EmptyState text="Aún no has completado misiones hoy." /> : completadas.map((m) => <div key={m.id} className="flex items-center gap-3 rounded-xl border border-soul-teal/30 bg-soul-teal/5 p-4"><span className="text-2xl">✅</span><div className="flex-1"><p className="font-semibold line-through opacity-80">{m.title}</p><p className="text-xs text-muted-foreground">{m.desc}</p></div><span className="text-[10px] font-bold text-soul-gold">+{m.reward.xp} XP</span></div>))}
    {tab === "Bloqueadas" && (bloqueadas.length === 0 ? <EmptyState text="No hay misiones bloqueadas." /> : bloqueadas.map((m) => <button key={m.id} onClick={() => toast.error(`Requiere nivel ${m.requiredLevel}`, { icon: "🔒" })} className="w-full rounded-xl border border-border bg-card/50 p-4 text-left opacity-70"><div className="flex items-center gap-3"><Lock className="h-6 w-6 text-muted-foreground" /><div><p className="font-semibold">{m.title}</p><p className="text-xs text-muted-foreground">{m.desc}</p><span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">{m.rarity} • Requiere nivel {m.requiredLevel}</span></div></div></button>))}</div>
    {active?.type === "breathing" && <BreathingMission cycles={active.id === "deep-breath" ? 8 : active.id === "breath-box" || active.id === "breath-night" ? 6 : 4} onComplete={() => finishMission(active, "Respiración completada")} onClose={() => setActive(null)} />}
    {(active?.type === "journal" || active?.type === "social") && <JournalMission onComplete={(_t, mood) => finishMission(active, `Mood: ${mood}`)} onClose={() => setActive(null)} />}
    {active?.type === "timer" && <TimerMission title={active.title} emoji={active.emoji} durationSec={active.durationSec || 30} description={active.desc} onComplete={() => finishMission(active)} onClose={() => setActive(null)} />}
    {active?.type === "gratitude" && <GratitudeMission onComplete={() => finishMission(active, "Gratitud sellada")} onClose={() => setActive(null)} />}
    {active?.type === "quiz" && <QuizMission onComplete={(s, t) => finishMission(active, `Aciertos: ${s}/${t}`)} onClose={() => setActive(null)} />}
    {active?.type === "ar-aura" && <ARAuraMission onComplete={() => finishMission(active, "Aura sincronizada 🌬️")} onClose={() => setActive(null)} />}
    {active?.type === "ar-energy" && <AREnergyMission onComplete={() => finishMission(active, "Avatar cargado ⚡")} onClose={() => setActive(null)} />}
    {active?.type === "ar-focus" && <ARFocusMission onComplete={() => finishMission(active, "Enfoque sostenido 🎯")} onClose={() => setActive(null)} />}
    {active?.type === "meditation" && <MeditationMission durationSec={active.durationSec || 120} onComplete={() => finishMission(active, "Meditación completada 🧘")} onClose={() => setActive(null)} />}
    {active?.type === "daily-challenge" && <DailyChallengeMission onComplete={(title) => finishMission(active, title)} onClose={() => setActive(null)} />}
    {active?.type === "ar-walk" && <ARWalkMission goal={30} onComplete={() => finishMission(active, "Caminata completada 🚶")} onClose={() => setActive(null)} />}
  </div></MobileLayout>;
}

function MissionCard({ mission, onStart, ar, onSkip, skipped }: { mission: Mission; onStart: () => void; ar?: boolean; onSkip?: () => void; skipped?: boolean }) {
  const rarityColor = mission.rarity === "Legendaria" ? "bg-soul-gold/20 text-soul-gold" : mission.rarity === "Épica" ? "bg-primary/20 text-primary" : mission.rarity === "Raro" ? "bg-soul-teal/20 text-soul-teal" : "bg-secondary text-muted-foreground";
  return <div className="relative"><button onClick={onStart} className={`w-full rounded-xl border bg-card p-4 text-left ${ar ? "border-primary/40" : "border-border"}`}><div className="flex items-start gap-3"><span className="text-3xl">{mission.emoji}</span><div className="flex-1"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{mission.title}</p><span className={`rounded-full px-2 py-0.5 text-[10px] ${rarityColor}`}>{mission.rarity}</span></div><p className="mt-0.5 text-xs text-muted-foreground">{mission.desc}</p><div className="mt-2 flex flex-wrap items-center gap-2">{mission.reward.xp ? <span className="text-[10px] font-bold text-soul-gold">+{mission.reward.xp} XP</span> : null}{mission.reward.coins ? <span className="flex items-center gap-0.5 text-[10px]"><Coins className="h-3 w-3 text-soul-gold" />{mission.reward.coins}</span> : null}{mission.reward.gems ? <span className="flex items-center gap-0.5 text-[10px]"><Gem className="h-3 w-3 text-primary" />{mission.reward.gems}</span> : null}{mission.reward.stats && <span className="flex items-center gap-0.5 rounded-full bg-soul-teal/10 px-1.5 py-0.5 text-[9px] text-soul-teal"><Sparkles className="h-2.5 w-2.5" />{Object.keys(mission.reward.stats).length} stats</span>}{ar && <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] text-primary"><Camera className="h-2.5 w-2.5" />AR</span>}</div><p className="mt-2 text-[10px] font-semibold text-primary">Toca para iniciar →</p></div></div></button>{onSkip && <button onClick={onSkip} aria-label={`Omitir ${mission.title} hoy`} className="absolute bottom-3 right-3 min-h-8 rounded-full border border-border px-3 text-[10px] font-semibold text-muted-foreground">Omitir hoy</button>}{skipped && <span className="absolute bottom-3 right-3 rounded-full bg-secondary px-3 py-1 text-[10px] text-muted-foreground">Omitida</span>}</div>;
}
function EmptyState({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center"><p className="text-sm text-muted-foreground">{text}</p></div>; }
