import { CheckCircle2 } from "lucide-react";
import { SkipForward } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/presentation/components/layout/MobileLayout";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Lock, Camera, Clock } from "lucide-react";
import { ResourceBar } from "@/presentation/components/layout/ResourceBar";
import { toast } from "sonner";
import { useUserStore } from "@/presentation/hooks/useUserStore";
import { useWellbeing } from "@/presentation/hooks/useWellbeing";
import { GRATITUDE_HINTS, MEDITATION_GUIDES, WRITING_PROMPTS, estimateMinutes, missionCategory, getMissionById, pathBlocker, visibleMissions, type Mission } from "@/domain/gamification/missionsData";
import { quizFor } from "@/domain/gamification/quizzes";
import type { TaskCategoryName } from "@/domain/gamification/rewards";
import { RecommendedStrip } from "@/presentation/components/missions/RecommendedStrip";
import { PathCard } from "@/presentation/components/missions/PathCard";
import { AFFINITY_XP_MULT, CATEGORY_LABEL, getArchetypeStyle, isAffine, withAlpha } from "@/domain/identity/archetype";
import { ArchetypeCrest } from "@/presentation/components/avatars/ArchetypeCrest";
import type { ZoneKey } from "@/domain/world/dioramas";
import { arZoneFor } from "@/domain/world/missionZones";
import { PageSkeleton } from "@/presentation/components/layout/PageSkeleton";
import { Reveal } from "@/presentation/components/motion/Reveal";
import { MISSION_BANNER_MS, emitFeedback } from "@/shared/feedback";
import { AnimatedNumber } from "@/presentation/components/motion/AnimatedNumber";

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
  StepsMission: () => import("@/presentation/components/missions/StepsMission").then((m) => ({ default: m.StepsMission })),
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
const StepsMission = lazy(missionLoaders.StepsMission);
function preloadMissions() {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  const run = () => { for (const load of Object.values(missionLoaders)) void load(); };
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 3000 }); else setTimeout(run, 1200);
}

const ZONE_KEYS: ZoneKey[] = ["valle", "bosque", "reino", "montana"];

export const Route = createFileRoute("/missions")({
  head: () => ({ meta: [
    { title: "Misiones | SoulSync" },
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
// Secciones por tipo de misión (las AR van aparte) y su orden en la pantalla.
const SECTIONS: { key: TaskCategoryName; label: string; icon: string; hint: string }[] = [
  { key: "autocuidado", label: "Autocuidado", icon: "lotus", hint: "Respira, descansa y cuida tu cuerpo" },
  { key: "reflexion", label: "Reflexión", icon: "scroll-quill", hint: "Escribe y ordena lo que sientes" },
  { key: "movimiento", label: "Movimiento", icon: "run", hint: "Activa tu cuerpo, aunque sean minutos" },
  { key: "social", label: "Conexión social", icon: "shaking-hands", hint: "Acércate a las personas que te suman" },
  { key: "cognitivo", label: "Mente", icon: "brain", hint: "Aprende, enfoca y juega con ideas" },
  { key: "ar", label: "Realidad aumentada", icon: "smartphone", hint: "Lleva a tu héroe a tu mundo real" },
];
type Filter = "todas" | TaskCategoryName;

function MissionsPage() {
  const { user, completeMission, isLoading } = useUserStore();
  const { logTask } = useWellbeing();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("todas");
  const [showLocked, setShowLocked] = useState(false);
  const [active, setActive] = useState<Mission | null>(null);
  const { mission: missionParam, from: fromParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [fromZone, setFromZone] = useState<ZoneKey | null>(null);
  // Momento en que se abrió la misión: su duración real se guarda con la tarea completada.
  const startedAt = useRef(0);
  // Momento en que se anunció "¡Misión cumplida!" (0 = aún no): las AR lo anuncian al lograr el objetivo.
  const announcedAt = useRef(0);
  const openMission = (m: Mission) => { startedAt.current = Date.now(); announcedAt.current = 0; setActive(m); };
  const announce = (m: Mission) => {
    if (announcedAt.current) return;
    announcedAt.current = Date.now();
    emitFeedback({ type: "missionComplete", title: m.title, icon: m.icon });
  };
  const archStyle = getArchetypeStyle(user.archetype);
  const affine = (m: Mission) => isAffine(user.archetype, missionCategory(m));
  useEffect(() => { preloadMissions(); }, []);
  useEffect(() => {
    if (!missionParam) return;
    const m = getMissionById(missionParam);
    const allowed = m && (m.archetype === undefined || m.archetype === user.archetype);
    if (m && allowed && (!m.requiredLevel || user.level >= m.requiredLevel) && !pathBlocker(m, new Set(user.pathDone))) { openMission(m); setFromZone(fromParam ?? null); }
    void navigate({ search: {}, replace: true });
  }, [missionParam, fromParam, navigate, user.level, user.pathDone, user.archetype]);
  // Al cerrar o terminar una misión abierta desde una zona, se vuelve a esa zona del Mundo.
  const closeMission = () => {
    setActive(null);
    if (fromZone) { const zone = fromZone; setFromZone(null); void navigate({ to: "/world", search: { zone } }); }
  };
  const today = new Date().toDateString();
  const completedToday = useMemo(() => new Set(user.missionHistory.filter((m) => m.date === today).map((m) => m.id)), [user.missionHistory, today]);
  const pathDone = useMemo(() => new Set(user.pathDone), [user.pathDone]);
  const isLocked = (m: Mission) => (!!m.requiredLevel && user.level < m.requiredLevel) || !!pathBlocker(m, pathDone);
  const { exclusive, bySection, locked } = useMemo(() => {
    const mine = visibleMissions(user.archetype);
    const exclusive = mine.filter((m) => m.archetype !== undefined && !isLocked(m));
    const locked = mine.filter((m) => isLocked(m) && !m.path);
    const general = mine.filter((m) => m.archetype === undefined && !m.path && !isLocked(m));
    // Dentro de cada sección: pendientes primero (afines antes), las hechas hoy al final.
    const order = (list: Mission[]) => [...list].sort((a, b) =>
      Number(completedToday.has(a.id)) - Number(completedToday.has(b.id)) || Number(affine(b)) - Number(affine(a)));
    const bySection = SECTIONS.map((s) => ({ ...s, missions: order(general.filter((m) => missionCategory(m) === s.key)) }));
    return { exclusive: order(exclusive), bySection, locked };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.level, user.archetype, completedToday, pathDone]);
  // Por qué está bloqueada: nivel o paso anterior de la ruta.
  const lockText = (m: Mission) => { const b = pathBlocker(m, pathDone); return b ? `Primero cumple «${b.title}»` : `Se desbloquea en el nivel ${m.requiredLevel}`; };
  const skipMission = (m: Mission) => {
    setSkipped((prev) => new Set(prev).add(m.id));
    logTask.mutate({ missionId: m.id, title: m.title, status: "skipped", category: missionCategory(m), isAR: m.isAR ?? false });
    toast("Misión omitida por hoy. ¡Mañana habrá otra oportunidad!", { icon: <SkipForward className="h-4 w-4" /> });
  };
  const finishMission = async (m: Mission, extraNote?: string) => {
    // 1. Al instante: "¡Misión cumplida!" (si la misión AR no lo anunció ya) mientras se guarda.
    announce(m);
    setActive(null);
    const durationSeconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
    const bannerLeft = Math.max(0, MISSION_BANNER_MS - (Date.now() - announcedAt.current));
    const [res] = await Promise.all([
      completeMission(m.id, { durationSeconds }),
      new Promise((resolve) => setTimeout(resolve, bannerLeft)),
    ]);
    announcedAt.current = 0;
    if (!res.ok) { closeMission(); return; }
    // 2. Después del aviso: recompensas que el servidor otorgó de verdad (catálogo + afinidad + objetos).
    emitFeedback({ type: "reward", xp: res.gainedXp, coins: res.gainedCoins, gems: res.gainedGems });
    const bonus = res.affinity ? ` · afín a tu ${archStyle.name}` : "";
    toast.success(`¡${m.title} completada! +${res.gainedXp} XP${bonus}`, { icon: <GameIcon name={m.icon} className="h-5 w-5 text-soul-gold" />, description: extraNote });
    // Luego, si los hubo, la subida de nivel y los logros nuevos.
    if (res.leveledUp) emitFeedback({ type: "levelup", level: res.newLevel });
    for (const code of res.unlockedAchievements ?? []) emitFeedback({ type: "achievement", code });
    // Con el progreso ya guardado, vuelve a la zona de origen para ver cómo creció.
    closeMission();
  };
  if (isLoading) return <MobileLayout><PageSkeleton variant="missions" /></MobileLayout>;

  const card = (m: Mission) => (
    <MissionCard
      key={m.id}
      mission={m}
      affine={affine(m) ? archStyle.name : undefined}
      done={completedToday.has(m.id)}
      skipped={skipped.has(m.id)}
      onStart={() => openMission(m)}
      onSkip={() => skipMission(m)}
    />
  );
  const visibleSections = bySection.filter((s) => s.missions.length > 0 && (filter === "todas" || filter === s.key));
  const doneCount = completedToday.size;

  return <MobileLayout><div className="px-4 pt-6 pb-4">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <ArchetypeCrest archetype={user.archetype} level={user.level} size={40} />
        <div>
          <h1 className="text-2xl font-cinzel font-bold">Misiones</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {doneCount === 0 ? "Elige tu primera hazaña del día" : `Hoy llevas ${doneCount} ${doneCount === 1 ? "misión" : "misiones"} de ${user.settings.dailyGoal} de tu meta`}
          </p>
        </div>
      </div>
      <div className="rounded-full border border-soul-gold/30 bg-soul-gold/10 px-2.5 py-1 text-xs font-bold text-soul-gold"><AnimatedNumber value={user.xp} /> XP</div>
    </div>
    <ResourceBar streak={user.streak} coins={user.coins} gems={user.gems} className="mt-4" />

    <div className="mt-4 space-y-3">
      <RecommendedStrip onStart={openMission} exclude={completedToday} />

      {exclusive.length > 0 && (
        <section className="rounded-2xl border p-3" style={{ borderColor: withAlpha(archStyle.accent, 0.45), backgroundColor: withAlpha(archStyle.accent, 0.07) }}>
          <p className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide" style={{ color: archStyle.accent }}>
            <GameIcon name={archStyle.icon} className="h-4 w-4" /> Solo para tu {archStyle.name}
          </p>
          <p className="px-1 text-xs text-muted-foreground">{archStyle.trait} · misiones afines: {archStyle.affinity.map((c) => CATEGORY_LABEL[c]).join(" y ")} (+{Math.round((AFFINITY_XP_MULT - 1) * 100)} % XP)</p>
          <div className="mt-2 space-y-2">{exclusive.map(card)}</div>
        </section>
      )}

      <PathCard id="dwm" done={pathDone} doneToday={completedToday} onStart={openMission} />
    </div>

    {/* Filtros por tipo de misión */}
    <div className="-mx-4 mt-5 overflow-x-auto px-4 [scrollbar-width:none]" role="tablist" aria-label="Tipos de misión">
      <div className="flex w-max gap-2">
        {([{ key: "todas", label: "Todas", icon: "crossed-swords" }, ...SECTIONS] as { key: Filter; label: string; icon: string }[]).map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${filter === f.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
          >
            <GameIcon name={f.icon} className="h-3.5 w-3.5" /> {f.label}
          </button>
        ))}
      </div>
    </div>

    <div className="mt-4 space-y-6">
      {visibleSections.map((s) => {
        const done = s.missions.filter((m) => completedToday.has(m.id)).length;
        return (
          <section key={s.key} aria-label={s.label}>
            <div className="mb-2 flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-cinzel font-semibold text-foreground"><GameIcon name={s.icon} className="h-4 w-4 text-primary" /> {s.label}</h2>
                <p className="text-xs text-muted-foreground">{s.hint}</p>
              </div>
              <span className="text-xs text-muted-foreground">{done}/{s.missions.length} hoy</span>
            </div>
            <div className="space-y-2">{s.missions.map((m, i) => <Reveal key={m.id} index={i}>{card(m)}</Reveal>)}</div>
          </section>
        );
      })}
      {visibleSections.length === 0 && <EmptyState text="No hay misiones de este tipo por ahora." />}

      {locked.length > 0 && (
        <section>
          <button onClick={() => setShowLocked((v) => !v)} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-dashed border-border px-3 text-sm text-muted-foreground" aria-expanded={showLocked}>
            <span className="flex items-center gap-2"><Lock className="h-4 w-4" aria-hidden /> Por desbloquear ({locked.length})</span>
            <span className="text-xs">{showLocked ? "Ocultar" : "Ver"}</span>
          </button>
          {showLocked && (
            <div className="mt-2 space-y-2">
              {locked.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3 opacity-75">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><GameIcon name={m.icon} className="h-6 w-6" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{lockText(m)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>

    <Suspense fallback={<MissionLoading />}>
    {active?.type === "breathing" && <BreathingMission cycles={active.id === "deep-breath" ? 8 : active.id === "breath-box" || active.id === "breath-night" ? 6 : 4} onComplete={() => finishMission(active, "Respiración completada")} onClose={closeMission} />}
    {(active?.type === "journal" || active?.type === "social") && <JournalMission title={active.title} icon={active.icon} prompts={WRITING_PROMPTS[active.id]} onComplete={(_t, mood) => finishMission(active, `Ánimo: ${mood}`)} onClose={closeMission} />}
    {active?.type === "timer" && <TimerMission title={active.title} icon={active.icon} durationSec={active.durationSec || 60} description={active.desc} onComplete={() => finishMission(active)} onClose={closeMission} />}
    {active?.type === "gratitude" && <GratitudeMission title={active.title} hint={GRATITUDE_HINTS[active.id]} onComplete={() => finishMission(active, "Gratitud sellada")} onClose={closeMission} />}
    {active?.type === "quiz" && <QuizMission title={active.title} icon={active.icon} questions={quizFor(active.id)} onComplete={(s, t) => finishMission(active, `Aciertos: ${s}/${t}`)} onClose={closeMission} />}
    {active?.type === "steps" && <StepsMission title={active.title} icon={active.icon} description={active.desc} steps={active.steps ?? []} source={active.source} onComplete={() => finishMission(active)} onClose={closeMission} />}
    {active?.type === "ar-aura" && <ARAuraMission zone={arZoneFor(active)} onAchieved={() => announce(active)} onComplete={() => finishMission(active, "Aura sincronizada")} onClose={closeMission} />}
    {active?.type === "ar-energy" && <AREnergyMission zone={arZoneFor(active)} onAchieved={() => announce(active)} onComplete={() => finishMission(active, "Personaje cargado de energía")} onClose={closeMission} />}
    {active?.type === "ar-focus" && <ARFocusMission zone={arZoneFor(active)} onAchieved={() => announce(active)} onComplete={() => finishMission(active, "Enfoque sostenido")} onClose={closeMission} />}
    {active?.type === "meditation" && <MeditationMission title={active.title} guide={MEDITATION_GUIDES[active.id]} durationSec={active.durationSec || 120} onComplete={() => finishMission(active, "Meditación completada")} onClose={closeMission} />}
    {active?.type === "daily-challenge" && <DailyChallengeMission onComplete={(title) => finishMission(active, title)} onClose={closeMission} />}
    {active?.type === "ar-walk" && <ARWalkMission zone={arZoneFor(active)} onAchieved={() => announce(active)} goal={active.id === "ar-walk-60" ? 60 : 30} onComplete={() => finishMission(active, "Caminata completada")} onClose={closeMission} />}
    </Suspense>
  </div></MobileLayout>;
}

const RARITY_TONE: Record<Mission["rarity"], string> = { Común: "text-muted-foreground", Raro: "text-soul-teal", Épica: "text-primary", Legendaria: "text-soul-gold" };

// Tarjeta compacta: ícono, título, una línea de descripción y lo esencial (tiempo, XP, AR, afinidad).
// affine: nombre del arquetipo si la misión le es afín (muestra la XP con la bonificación).
function MissionCard({ mission, onStart, onSkip, skipped, done, affine }: { mission: Mission; onStart: () => void; onSkip?: () => void; skipped?: boolean; done?: boolean; affine?: string }) {
  const xp = mission.reward.xp ? Math.round(mission.reward.xp * (affine ? AFFINITY_XP_MULT : 1)) : 0;
  return (
    <div className={`flex items-stretch rounded-xl border bg-card transition-colors ${done ? "border-soul-teal/30 opacity-70" : affine ? "border-soul-gold/40" : "border-border"}`}>
      <button onClick={onStart} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left active:scale-[0.99]">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${done ? "bg-soul-teal/15 text-soul-teal" : "bg-primary/10 text-primary"}`}>
          {done ? <CheckCircle2 className="h-6 w-6" aria-hidden /> : <GameIcon name={mission.icon} className="h-7 w-7" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-semibold text-foreground">{mission.title}</span>
            {mission.isAR && <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs text-primary"><Camera className="h-3 w-3" aria-hidden />AR</span>}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{mission.desc}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {done ? <span className="font-semibold text-soul-teal">Hecha hoy · puedes repetirla</span> : skipped ? <span className="text-muted-foreground">Omitida hoy</span> : (
              <>
                <span className="flex items-center gap-0.5 text-muted-foreground"><Clock className="h-3 w-3" aria-hidden />{estimateMinutes(mission)} min</span>
                {xp ? <span className="font-bold text-soul-gold">+{xp} XP</span> : null}
                <span className={RARITY_TONE[mission.rarity]}>{mission.rarity}</span>
                {affine && <span className="rounded-full bg-soul-gold/15 px-1.5 text-soul-gold">Afín</span>}
              </>
            )}
          </span>
        </span>
      </button>
      {!done && !skipped && onSkip && (
        <button onClick={onSkip} aria-label={`Omitir ${mission.title} hoy`} className="flex w-12 shrink-0 items-center justify-center border-l border-border text-muted-foreground hover:text-foreground">
          <SkipForward className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
function MissionLoading() { return <div role="status" aria-label="Cargando misión" className="fixed inset-0 z-[58] flex items-center justify-center bg-background/80 backdrop-blur-sm"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>; }
function EmptyState({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center"><p className="text-sm text-muted-foreground">{text}</p></div>; }
