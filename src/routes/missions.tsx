import { CheckCircle2 } from "lucide-react";
import { SkipForward } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/presentation/components/layout/MobileLayout";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Lock, Coins, Gem, Sparkles, Camera } from "lucide-react";
import { ResourceBar } from "@/presentation/components/layout/ResourceBar";
import { toast } from "sonner";
import { useUserStore } from "@/presentation/hooks/useUserStore";
import { useWellbeing } from "@/presentation/hooks/useWellbeing";
import { MISSIONS, missionCategory, getMissionById, type Mission } from "@/domain/gamification/missionsData";
import { AFFINITY_XP_MULT, CATEGORY_LABEL, getArchetypeStyle, isAffine } from "@/domain/identity/archetype";
import { ArchetypeCrest } from "@/presentation/components/avatars/ArchetypeCrest";
import type { ZoneKey } from "@/domain/world/dioramas";
import { arZoneFor } from "@/domain/world/missionZones";
import { PageSkeleton } from "@/presentation/components/layout/PageSkeleton";
import { Reveal } from "@/presentation/components/motion/Reveal";
import { playSound } from "@/shared/sound";
import { emitFeedback } from "@/shared/feedback";
import { AnimatedNumber } from "@/presentation/components/motion/AnimatedNumber";
import { success as hapticSuccess } from "@/shared/haptics";

// Las misiones se abren de a una: cada pantalla de misión se descarga aparte y se precarga
// cuando el navegador queda libre, para que la lista aparezca antes y abrirlas siga siendo inmediato.
const missionLoaders = {
  BreathingMission: () => import("@/presentation/components/missions/BreathingMission").then((m) => ({ default: m.BreathingMission })),
  JournalMission: () => import("@/presentation/components/missions/JournalMission").then((m) => ({ default: m.JournalMission })),
  TimerMission: () => import("@/presentation/components/missions/TimerMission").then((m) => ({ default: m.TimerMission })),
  GratitudeMission: () => import("@/presentation/components/missions/GratitudeMission").then((m) => ({ default: m.GratitudeMission })),
  QuizMission: () => import("@/presentation/components/missions/QuizMission").then((m) => ({ default: m.QuizMission })),
  ARAuraMission: () => import("@/presentation/components/missions/ARAuraMission").then((m) => ({ default: m.ARAuraMission })),
  AREnergyMission: () => import("@/presentation/components/missions/AREnergyMission").then((m) => ({ default: m.AREnergyMission })),
  ARFocusMission: () => import("@/presentation/components/missions/ARFocusMission").then((m) => ({ default: m.ARFocusMission })),
  MeditationMission: () => import("@/presentation/components/missions/MeditationMission").then((m) => ({ default: m.MeditationMission })),
  DailyChallengeMission: () => import("@/presentation/components/missions/DailyChallengeMission").then((m) => ({ default: m.DailyChallengeMission })),
  ARWalkMission: () => import("@/presentation/components/missions/ARWalkMission").then((m) => ({ default: m.ARWalkMission })),
};
const BreathingMission = lazy(missionLoaders.BreathingMission);
const JournalMission = lazy(missionLoaders.JournalMission);
const TimerMission = lazy(missionLoaders.TimerMission);
const GratitudeMission = lazy(missionLoaders.GratitudeMission);
const QuizMission = lazy(missionLoaders.QuizMission);
const ARAuraMission = lazy(missionLoaders.ARAuraMission);
const AREnergyMission = lazy(missionLoaders.AREnergyMission);
const ARFocusMission = lazy(missionLoaders.ARFocusMission);
const MeditationMission = lazy(missionLoaders.MeditationMission);
const DailyChallengeMission = lazy(missionLoaders.DailyChallengeMission);
const ARWalkMission = lazy(missionLoaders.ARWalkMission);
function preloadMissions() {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  const run = () => { for (const load of Object.values(missionLoaders)) void load(); };
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 3000 }); else setTimeout(run, 1200);
}

const ZONE_KEYS: ZoneKey[] = ["valle", "bosque", "reino", "montana"];

export const Route = createFileRoute("/missions")({
  head: () => ({ meta: [
    { title: "Misiones diarias | SoulSync" },
    { name: "description", content: "Misiones de autocuidado, reflexión, movimiento y realidad aumentada en SoulSync." },
    { property: "og:title", content: "Misiones diarias | SoulSync" },
    { property: "og:description", content: "Misiones de autocuidado, reflexión, movimiento y realidad aumentada en SoulSync." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  // from: zona del Mundo desde la que se abrió la misión (para volver a ella al terminar).
  validateSearch: (search: Record<string, unknown>): { mission?: string; from?: ZoneKey } => ({
    mission: typeof search.mission === "string" ? search.mission : undefined,
    from: typeof search.from === "string" && ZONE_KEYS.includes(search.from as ZoneKey) ? (search.from as ZoneKey) : undefined,
  }),
  component: MissionsPage,
});
const tabs = ["Activas", "AR", "Completadas", "Bloqueadas"] as const;

function MissionsPage() {
  const { user, completeMission, isLoading } = useUserStore();
  const { logTask } = useWellbeing();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<typeof tabs[number]>("Activas");
  const [active, setActive] = useState<Mission | null>(null);
  const { mission: missionParam, from: fromParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [fromZone, setFromZone] = useState<ZoneKey | null>(null);
  // Momento en que se abrió la misión: su duración real se guarda con la tarea completada.
  const startedAt = useRef(0);
  const openMission = (m: Mission) => { startedAt.current = Date.now(); setActive(m); };
  const archStyle = getArchetypeStyle(user.archetype);
  const affine = (m: Mission) => isAffine(user.archetype, missionCategory(m));
  useEffect(() => { preloadMissions(); }, []);
  useEffect(() => {
    if (!missionParam) return;
    const m = getMissionById(missionParam);
    if (m && (!m.requiredLevel || user.level >= m.requiredLevel)) { openMission(m); setFromZone(fromParam ?? null); }
    void navigate({ search: {}, replace: true });
  }, [missionParam, fromParam, navigate, user.level]);
  // Al cerrar o terminar una misión abierta desde una zona, se vuelve a esa zona del Mundo.
  const closeMission = () => {
    setActive(null);
    if (fromZone) { const zone = fromZone; setFromZone(null); void navigate({ to: "/world", search: { zone } }); }
  };
  const today = new Date().toDateString();
  const completedToday = useMemo(() => new Set(user.missionHistory.filter((m) => m.date === today).map((m) => m.id)), [user.missionHistory, today]);
  const { activas, ar, completadas, bloqueadas } = useMemo(() => {
    const activas: Mission[] = [], ar: Mission[] = [], completadas: Mission[] = [], bloqueadas: Mission[] = [];
    for (const m of MISSIONS) {
      if (m.requiredLevel && user.level < m.requiredLevel) bloqueadas.push(m);
      else if (completedToday.has(m.id)) completadas.push(m);
      else if (m.isAR) ar.push(m); else activas.push(m);
    }
    // Las misiones afines al arquetipo van primero (el orden del catálogo se mantiene entre iguales).
    const byAffinity = (list: Mission[]) => [...list.filter((m) => isAffine(user.archetype, missionCategory(m))), ...list.filter((m) => !isAffine(user.archetype, missionCategory(m)))];
    return { activas: byAffinity(activas), ar: byAffinity(ar), completadas, bloqueadas };
  }, [user.level, user.archetype, completedToday]);
  const skipMission = (m: Mission) => {
    setSkipped((prev) => new Set(prev).add(m.id));
    logTask.mutate({ missionId: m.id, title: m.title, status: "skipped", category: missionCategory(m), isAR: m.isAR ?? false });
    toast("Tarea omitida hoy", { icon: <SkipForward className="h-4 w-4" /> });
  };
  const finishMission = async (m: Mission, extraNote?: string) => {
    setActive(null);
    const durationSeconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
    const res = await completeMission(m.id, { durationSeconds });
    if (!res.ok) { closeMission(); return; }
    playSound("complete");
    hapticSuccess();
    // Se muestra lo que el servidor otorgó de verdad (catálogo + afinidad + objetos).
    emitFeedback({ type: "reward", xp: res.gainedXp, coins: res.gainedCoins, gems: res.gainedGems });
    const bonus = res.affinity ? ` · afín a tu ${archStyle.name}` : "";
    toast.success(`¡${m.title} completada! +${res.gainedXp} XP${bonus}`, { icon: <GameIcon name={m.icon} className="h-5 w-5 text-soul-gold" />, description: extraNote });
    // Con el progreso ya guardado, vuelve a la zona de origen para ver cómo creció.
    closeMission();
  };
  if (isLoading) return <MobileLayout><PageSkeleton variant="missions" /></MobileLayout>;
  return <MobileLayout><div className="px-4 pt-6">
    <div className="flex items-start justify-between"><div className="flex items-center gap-3"><ArchetypeCrest archetype={user.archetype} level={user.level} size={40} /><div><h1 className="text-2xl font-cinzel font-bold">Misiones</h1><p className="mt-1 text-sm text-muted-foreground">{archStyle.affinity.length ? <>Afines a tu {archStyle.name}: {archStyle.affinity.map((c) => CATEGORY_LABEL[c]).join(" y ")} <span className="text-soul-gold">(+{Math.round((AFFINITY_XP_MULT - 1) * 100)} % XP)</span></> : "Tu camino de crecimiento"}</p></div></div><div className="rounded-full border border-soul-gold/30 bg-soul-gold/10 px-2.5 py-1 text-xs font-bold text-soul-gold"><AnimatedNumber value={user.xp} /> XP</div></div>
    <ResourceBar streak={user.streak} coins={user.coins} gems={user.gems} className="mt-4" />
    <div className="mt-5 flex rounded-xl bg-card p-1">{tabs.map((t) => { const count = t === "Activas" ? activas.length : t === "AR" ? ar.length : t === "Completadas" ? completadas.length : bloqueadas.length; return <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${tab === t ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>{t === "AR" && <Camera className="mr-0.5 inline h-3 w-3" />}{t} <span className="opacity-70">({count})</span></button>; })}</div>
    <div className="mt-4 space-y-3">{tab === "Activas" && (activas.length === 0 ? <EmptyState text="¡Has completado todas las misiones de hoy! Vuelve mañana." /> : activas.map((m, i) => <Reveal key={m.id} index={i}><MissionCard mission={m} affine={affine(m) ? archStyle.name : undefined} onStart={() => openMission(m)} onSkip={skipped.has(m.id) ? undefined : () => skipMission(m)} skipped={skipped.has(m.id)} /></Reveal>))}
    {tab === "AR" && <>{<div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Las misiones AR usan la cámara de tu móvil + un mini avatar 3D para experiencias inmersivas.</div>}{ar.length === 0 ? <EmptyState text="Ya completaste las misiones AR de hoy." /> : ar.map((m, i) => <Reveal key={m.id} index={i}><MissionCard mission={m} affine={affine(m) ? archStyle.name : undefined} onStart={() => openMission(m)} ar /></Reveal>)}</>}
    {tab === "Completadas" && (completadas.length === 0 ? <EmptyState text="Aún no has completado misiones hoy." /> : completadas.map((m) => <div key={m.id} className="flex items-center gap-3 rounded-xl border border-soul-teal/30 bg-soul-teal/5 p-4"><CheckCircle2 className="h-6 w-6 shrink-0 text-soul-teal" /><div className="flex-1"><p className="font-semibold line-through opacity-80">{m.title}</p><p className="text-xs text-muted-foreground">{m.desc}</p></div><span className="text-xs font-bold text-soul-gold">+{m.reward.xp} XP</span></div>))}
    {tab === "Bloqueadas" && (bloqueadas.length === 0 ? <EmptyState text="No hay misiones bloqueadas." /> : bloqueadas.map((m) => <button key={m.id} onClick={() => toast.error(`Requiere nivel ${m.requiredLevel}`, { icon: <Lock className="h-4 w-4" /> })} className="w-full rounded-xl border border-border bg-card/50 p-4 text-left opacity-70"><div className="flex items-center gap-3"><Lock className="h-6 w-6 text-muted-foreground" /><div><p className="font-semibold">{m.title}</p><p className="text-xs text-muted-foreground">{m.desc}</p><span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">{m.rarity} • Requiere nivel {m.requiredLevel}</span></div></div></button>))}</div>
    <Suspense fallback={<MissionLoading />}>
    {active?.type === "breathing" && <BreathingMission cycles={active.id === "deep-breath" ? 8 : active.id === "breath-box" || active.id === "breath-night" ? 6 : 4} onComplete={() => finishMission(active, "Respiración completada")} onClose={closeMission} />}
    {(active?.type === "journal" || active?.type === "social") && <JournalMission onComplete={(_t, mood) => finishMission(active, `Mood: ${mood}`)} onClose={closeMission} />}
    {active?.type === "timer" && <TimerMission title={active.title} icon={active.icon} durationSec={active.durationSec || 30} description={active.desc} onComplete={() => finishMission(active)} onClose={closeMission} />}
    {active?.type === "gratitude" && <GratitudeMission onComplete={() => finishMission(active, "Gratitud sellada")} onClose={closeMission} />}
    {active?.type === "quiz" && <QuizMission onComplete={(s, t) => finishMission(active, `Aciertos: ${s}/${t}`)} onClose={closeMission} />}
    {active?.type === "ar-aura" && <ARAuraMission zone={arZoneFor(active)} onComplete={() => finishMission(active, "Aura sincronizada")} onClose={closeMission} />}
    {active?.type === "ar-energy" && <AREnergyMission zone={arZoneFor(active)} onComplete={() => finishMission(active, "Personaje cargado de energía")} onClose={closeMission} />}
    {active?.type === "ar-focus" && <ARFocusMission zone={arZoneFor(active)} onComplete={() => finishMission(active, "Enfoque sostenido")} onClose={closeMission} />}
    {active?.type === "meditation" && <MeditationMission durationSec={active.durationSec || 120} onComplete={() => finishMission(active, "Meditación completada")} onClose={closeMission} />}
    {active?.type === "daily-challenge" && <DailyChallengeMission onComplete={(title) => finishMission(active, title)} onClose={closeMission} />}
    {active?.type === "ar-walk" && <ARWalkMission zone={arZoneFor(active)} goal={active.id === "ar-walk-60" ? 60 : 30} onComplete={() => finishMission(active, "Caminata completada")} onClose={closeMission} />}
    </Suspense>
  </div></MobileLayout>;
}

// affine: nombre del arquetipo si la misión le es afín (muestra la XP con la bonificación).
function MissionCard({ mission, onStart, ar, onSkip, skipped, affine }: { mission: Mission; onStart: () => void; ar?: boolean; onSkip?: () => void; skipped?: boolean; affine?: string }) {
  const xp = mission.reward.xp ? Math.round(mission.reward.xp * (affine ? AFFINITY_XP_MULT : 1)) : 0;
  const rarityColor = mission.rarity === "Legendaria" ? "bg-soul-gold/20 text-soul-gold" : mission.rarity === "Épica" ? "bg-primary/20 text-primary" : mission.rarity === "Raro" ? "bg-soul-teal/20 text-soul-teal" : "bg-secondary text-muted-foreground";
  return <div className="relative"><button onClick={onStart} className={`w-full rounded-xl border bg-card p-4 text-left ${affine ? "border-soul-gold/40" : ar ? "border-primary/40" : "border-border"}`}><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><GameIcon name={mission.icon} className="h-7 w-7" /></span><div className="flex-1"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{mission.title}</p><span className={`rounded-full px-2 py-0.5 text-xs ${rarityColor}`}>{mission.rarity}</span></div><p className="mt-0.5 text-xs text-muted-foreground">{mission.desc}</p><div className="mt-2 flex flex-wrap items-center gap-2">{xp ? <span className="text-xs font-bold text-soul-gold">+{xp} XP</span> : null}{affine && <span className="rounded-full bg-soul-gold/15 px-1.5 py-0.5 text-xs text-soul-gold">Afín a tu {affine}</span>}{mission.reward.coins ? <span className="flex items-center gap-0.5 text-xs"><Coins className="h-3 w-3 text-soul-gold" />{mission.reward.coins}</span> : null}{mission.reward.gems ? <span className="flex items-center gap-0.5 text-xs"><Gem className="h-3 w-3 text-primary" />{mission.reward.gems}</span> : null}{mission.reward.stats && <span className="flex items-center gap-0.5 rounded-full bg-soul-teal/10 px-1.5 py-0.5 text-xs text-soul-teal"><Sparkles className="h-2.5 w-2.5" />{Object.keys(mission.reward.stats).length} stats</span>}{ar && <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs text-primary"><Camera className="h-2.5 w-2.5" />AR</span>}</div><p className="mt-2 text-xs font-semibold text-primary">Toca para iniciar →</p></div></div></button>{onSkip && <button onClick={onSkip} aria-label={`Omitir ${mission.title} hoy`} className="absolute bottom-3 right-3 min-h-8 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground">Omitir hoy</button>}{skipped && <span className="absolute bottom-3 right-3 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">Omitida</span>}</div>;
}
function MissionLoading() { return <div role="status" aria-label="Cargando misión" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>; }
function EmptyState({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center"><p className="text-sm text-muted-foreground">{text}</p></div>; }
