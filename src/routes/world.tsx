import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { useWellbeing } from "@/hooks/useWellbeing";
import { useUserStore } from "@/hooks/useUserStore";
import { SEASON_COPY } from "@/lib/wellbeing/world";
import { TREND_COPY } from "@/lib/wellbeing/trend";
import { TimelineFeed } from "@/components/wellbeing/TimelineFeed";
import { Lock } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MISSIONS, MISSION_CATEGORY } from "@/lib/missionsData";
import type { WorldZone } from "@/lib/wellbeing/world";

export const Route = createFileRoute("/world")({
  head: () => ({
    meta: [
      { title: "Mi Mundo | SoulSync" },
      {
        name: "description",
        content:
          "Tu mundo evoluciona con las tareas diarias que completas, tus check-ins y la tendencia reciente de bienestar.",
      },
      { property: "og:title", content: "Mi Mundo | SoulSync" },
      {
        property: "og:description",
        content: "Mapa emocional y timeline unificado alimentados por tu actividad real en SoulSync.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorldPage,
});

function WorldPage() {
  const { data, isLoading } = useWellbeing();
  const { user } = useUserStore();
  const [zone, setZone] = useState<WorldZone | null>(null);

  const world = data?.world ?? null;
  const prediction = data?.prediction ?? null;
  const timeline = data?.timeline ?? [];

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-cinzel font-bold text-foreground">Mi Mundo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Evoluciona con tus tareas completadas y tus check-ins
        </p>

        {isLoading ? (
          <div className="mt-6 space-y-3" aria-busy="true">
            <div className="h-32 animate-pulse rounded-2xl bg-card" />
            <div className="h-48 animate-pulse rounded-2xl bg-card" />
          </div>
        ) : !data?.consent.accepted || !world ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Tu mundo se construye con tus tareas y check-ins. Activa el seguimiento en la
              sección de predicción para empezar a verlo evolucionar.
            </p>
            <Link
              to="/ai"
              className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-primary/40 bg-primary/5 px-4 text-sm font-semibold text-primary"
            >
              Ir a Predicción de bienestar →
            </Link>
          </div>
        ) : (
          <>
            {/* Progreso del día */}
            <section className="mt-6 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-cinzel font-semibold text-foreground">
                  {SEASON_COPY[world.season].label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {world.tasksToday}/{world.dailyGoal} tareas hoy
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {SEASON_COPY[world.season].description}
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${Math.min(100, (world.tasksToday / world.dailyGoal) * 100)}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Meter label="Vitalidad" value={world.vitality} tone="bg-soul-gold" />
                <Meter label="Armonía" value={world.harmony} tone="bg-soul-teal" />
              </div>
            </section>

            {/* Señal resumida */}
            <section className="mt-4 rounded-2xl border border-border bg-card p-4">
              <h2 className="font-cinzel font-semibold text-foreground">Señal de bienestar</h2>
              {prediction && prediction.riskLevel !== "insuficiente" ? (
                <>
                  <p className="mt-1 text-sm text-foreground">
                    Nivel <span className="font-semibold">{prediction.riskLevel}</span> ·{" "}
                    {TREND_COPY[prediction.trend].label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {TREND_COPY[prediction.trend].body}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Aún no hay suficientes registros para estimar tu tendencia.
                </p>
              )}
              <Link to="/ai" className="mt-3 inline-block text-xs font-semibold text-primary">
                Ver factores y detalle →
              </Link>
            </section>

            {/* Zonas */}
            <section className="mt-6">
              <h2 className="font-cinzel font-semibold text-foreground">Zonas</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {world.zones.map((z) => (
                  <button
                    key={z.key}
                    onClick={() => setZone(z)}
                    className={`rounded-2xl border-2 p-4 text-center transition-all active:scale-95 ${
                      z.unlocked ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-60"
                    }`}
                  >
                    <span className="inline-block text-4xl">{z.unlocked ? z.emoji : "🔒"}</span>
                    <p className="mt-2 text-sm font-semibold text-foreground">{z.name}</p>
                    {z.unlocked ? (
                      <>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${z.progress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">{z.progress}% · {z.description}</p>
                      </>
                    ) : (
                      <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Lock className="h-3 w-3" aria-hidden="true" /> Nivel {z.requiredLevel}
                        {user.level ? ` (vas en ${user.level})` : ""}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Timeline unificado */}
            <section className="mt-8 pb-4">
              <h2 className="font-cinzel font-semibold text-foreground">Timeline</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Check-ins, tareas, hitos y cambios de señal en una sola historia. Los elementos
                aparecen juntos por coincidencia temporal, no como causa y efecto.
              </p>
              <TimelineFeed entries={timeline} className="mt-4" />
            </section>
          </>
        )}
      </div>

      <ZoneSheet zone={zone} level={user.level} onClose={() => setZone(null)} />
    </MobileLayout>
  );
}

function ZoneSheet({ zone, level, onClose }: { zone: WorldZone | null; level: number; onClose: () => void }) {
  const missions = zone
    ? MISSIONS.filter((m) => zone.categories.includes(MISSION_CATEGORY[m.type]))
    : [];
  return (
    <Sheet open={!!zone} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        {zone && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2 font-cinzel">
                <span className="text-3xl">{zone.unlocked ? zone.emoji : "🔒"}</span> {zone.name}
              </SheetTitle>
              <SheetDescription>{zone.description}</SheetDescription>
            </SheetHeader>

            {zone.unlocked ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progreso de la zona</span>
                  <span className="font-semibold text-foreground">{zone.progress}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${zone.progress}%` }} />
                </div>

                <h3 className="mt-6 font-cinzel font-semibold text-foreground">Misiones de esta zona</h3>
                <div className="mt-3 space-y-2 pb-6">
                  {missions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay misiones asociadas todavía.</p>
                  ) : (
                    missions.map((m) => {
                      const locked = !!m.requiredLevel && level < m.requiredLevel;
                      return (
                        <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                          <span className="text-2xl">{m.emoji}</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{m.title}</p>
                            <p className="text-xs text-muted-foreground">{m.desc}</p>
                          </div>
                          {locked ? (
                            <span className="text-[10px] text-muted-foreground">Nivel {m.requiredLevel}</span>
                          ) : (
                            <Link
                              to="/missions"
                              search={{ mission: m.id }}
                              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                            >
                              Iniciar
                            </Link>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 pb-6">
                <p className="text-sm text-muted-foreground">
                  Esta zona se desbloquea al alcanzar el nivel {zone.requiredLevel}. Vas en el nivel {level}
                  {level < zone.requiredLevel ? ` · te faltan ${zone.requiredLevel - level} niveles` : ""}.
                </p>
                <Link
                  to="/missions"
                  className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-primary/40 bg-primary/5 px-4 text-sm font-semibold text-primary"
                >
                  Ganar XP en Misiones →
                </Link>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${tone} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
