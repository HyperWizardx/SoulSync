// Comunidad: las misiones sociales reales del catálogo (con el progreso del usuario y la afinidad
// de su arquetipo) y, aparte, la vista previa de la futura red de apoyo con datos de ejemplo.
import { Moon, ChevronRight, MapPin, MessageCircle } from "lucide-react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileLayout } from "@/presentation/components/layout/MobileLayout";
import { BackButton } from "@/presentation/components/layout/BackButton";
import { toast } from "sonner";
import { baseCategory, missionCategory, visibleMissions } from "@/domain/gamification/missionsData";
import { AFFINITY_XP_MULT, getArchetypeStyle, isAffine } from "@/domain/identity/archetype";
import { useProfileSummary, useUserStore } from "@/presentation/hooks/useUserStore";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [
    { title: "Comunidad | SoulSync" },
    { name: "description", content: "La comunidad de bienestar de SoulSync y sus conexiones de apoyo." },
    { property: "og:title", content: "Comunidad | SoulSync" },
    { property: "og:description", content: "La comunidad de bienestar de SoulSync y sus conexiones de apoyo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CommunityPage,
});

// Datos de ejemplo para la vista previa de la red de apoyo (aún no hay personas reales conectadas).
const SAMPLE_VOLUNTEERS = [
  { name: "Ana M.", role: "Psicóloga", dist: "0.5 km", icon: "doctor-face", online: true },
  { name: "Carlos R.", role: "Coach", dist: "1.2 km", icon: "teacher", online: true },
  { name: "Marta L.", role: "Voluntaria", dist: "2.0 km", icon: "shaking-hands", online: false },
  { name: "Pedro G.", role: "Mentor", dist: "3.5 km", icon: "wizard-face", online: true },
];


function CommunityPage() {
  const { user } = useUserStore();
  const { data: summary } = useProfileSummary();
  const archStyle = getArchetypeStyle(user.archetype);
  const today = new Date().toDateString();
  const doneToday = new Set(user.missionHistory.filter((m) => m.date === today).map((m) => m.id));
  const social30 = summary?.categories30?.social ?? 0;
  const SOCIAL_MISSIONS = visibleMissions(user.archetype).filter((m) => baseCategory(m) === "social");

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-6">
        <div className="flex items-center gap-1">
          <BackButton />
          <h1 className="text-2xl font-cinzel font-bold text-foreground">Comunidad</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Conectar con otros también es una misión</p>

        {/* Misiones sociales reales: abren la misión y cuentan para tu progreso */}
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel font-semibold text-foreground">Misiones sociales</h2>
            <span className="text-xs text-muted-foreground">{social30} en 30 días</span>
          </div>
          <div className="mt-3 space-y-2">
            {SOCIAL_MISSIONS.map((m) => {
              const locked = !!m.requiredLevel && user.level < m.requiredLevel;
              const done = doneToday.has(m.id);
              const affine = isAffine(user.archetype, missionCategory(m));
              const xp = Math.round((m.reward.xp ?? 0) * (affine ? AFFINITY_XP_MULT : 1));
              const body = (
                <>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${locked ? "bg-secondary text-muted-foreground" : "bg-soul-teal/10 text-soul-teal"}`}>
                    <GameIcon name={m.icon} className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{m.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {locked ? `Requiere nivel ${m.requiredLevel}` : done ? "Completada hoy" : `+${xp} XP${affine ? ` · afín a tu ${archStyle.name}` : ""}`}
                    </span>
                  </span>
                  {!locked && !done && <ChevronRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
                </>
              );
              return locked || done ? (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 opacity-70">{body}</div>
              ) : (
                <Link
                  key={m.id}
                  to="/missions"
                  search={{ mission: m.id }}
                  className={`flex items-center gap-3 rounded-xl border bg-card p-3 transition-transform active:scale-[0.98] ${affine ? "border-soul-gold/40" : "border-border"}`}
                >
                  {body}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Vista previa de la red de apoyo: datos de ejemplo, sin conexión real todavía */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel font-semibold text-foreground">Red de apoyo</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">Próximamente</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Vista previa con datos de ejemplo: pronto podrás encontrar acompañamiento cerca de ti.
          </p>

          <button
            onClick={() => toast("Mapa interactivo próximamente", { icon: <MapPin className="h-4 w-4" /> })}
            className="mt-3 flex h-32 w-full items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-soul-teal/5 transition-all hover:border-primary/50 active:scale-[0.98]"
          >
            <div className="flex flex-col items-center text-muted-foreground">
              <MapPin className="h-7 w-7 text-primary animate-float" />
              <p className="mt-2 text-sm">Mapa de voluntarios</p>
            </div>
          </button>

          <div className="mt-3 space-y-2 opacity-80">
            {SAMPLE_VOLUNTEERS.map((v) => (
              <div key={v.name} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"><GameIcon name={v.icon} className="h-7 w-7" /></span>
                  {v.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-soul-teal" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.role} • {v.dist} · ejemplo</p>
                </div>
                <button
                  onClick={() => toast("El chat con la red de apoyo llegará pronto", { icon: v.online ? <MessageCircle className="h-4 w-4" /> : <Moon className="h-4 w-4" /> })}
                  aria-label={`Contactar a ${v.name} (próximamente)`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-all active:scale-90"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
