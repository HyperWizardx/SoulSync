// Portada: presenta SoulSync con un diorama KayKit de las tierras del juego y uno de los héroes,
// que se turnan solos (o al tocar los puntos). Pocos elementos: título, escena, tres ideas y
// los dos botones para entrar.
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";
import { AdventureBackdrop } from "@/presentation/components/layout/AdventureBackdrop";
import { WorldDiorama } from "@/presentation/components/world/WorldDiorama";
import { zoneInfo } from "@/domain/world/world";
import { getArchetypeStyle } from "@/domain/identity/archetype";
import type { ZoneKey } from "@/domain/world/dioramas";
import { isMotionReduced } from "@/shared/devicePrefs";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "SoulSync · Tu aventura de bienestar" },
    { name: "description", content: "Elige tu héroe, cumple misiones de bienestar y haz florecer tu propio mundo en SoulSync." },
    { property: "og:title", content: "SoulSync · Tu aventura de bienestar" },
    { property: "og:description", content: "Elige tu héroe, cumple misiones de bienestar y haz florecer tu propio mundo en SoulSync." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SplashPage,
});

// Cada escena: una zona del Mundo con un héroe distinto.
const SHOWCASE: { zone: ZoneKey; archetype: number }[] = [
  { zone: "valle", archetype: 0 },
  { zone: "bosque", archetype: 2 },
  { zone: "reino", archetype: 3 },
  { zone: "montana", archetype: 1 },
];
const SHOWCASE_MS = 7000;

const FEATURES = [
  { icon: "crossed-swords", label: "Misiones diarias" },
  { icon: "windmill", label: "Un mundo que florece" },
  { icon: "compass", label: "Tu brújula interior" },
];

function SplashPage() {
  const navigate = useNavigate();
  const { hasSession, isCheckingSession } = useAuthSession();
  const [scene, setScene] = useState(0);

  useEffect(() => {
    if (!isCheckingSession && hasSession) navigate({ to: "/dashboard" });
  }, [isCheckingSession, hasSession, navigate]);

  // Las escenas se turnan solas, salvo que el usuario pida reducir movimiento.
  useEffect(() => {
    if (isMotionReduced()) return;
    const id = setInterval(() => setScene((s) => (s + 1) % SHOWCASE.length), SHOWCASE_MS);
    return () => clearInterval(id);
  }, []);

  const checking = isCheckingSession || hasSession;
  const current = SHOWCASE[scene];
  const hero = getArchetypeStyle(current.archetype);

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-6 pb-10 pt-10">
      <AdventureBackdrop />

      <header className="relative z-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-soul-gold/80">Tu aventura de bienestar</p>
        <h1 className="mt-2 bg-gradient-to-b from-[#fff3c4] to-soul-gold bg-clip-text font-cinzel text-5xl font-bold tracking-wide text-transparent drop-shadow">
          SoulSync
        </h1>
        <div className="mx-auto mt-3 h-[2px] w-20 rounded-full bg-gradient-to-r from-transparent via-soul-gold to-transparent" />
      </header>

      {/* Escena KayKit: zona del Mundo con su héroe; se puede girar con el dedo */}
      <section className="relative z-10 mt-4 w-full max-w-[380px]" aria-label="Tierras de SoulSync">
        <WorldDiorama
          zone={current.zone}
          icon={zoneInfo(current.zone).icon}
          progress={100}
          unlocked
          season="crecimiento"
          archetype={current.archetype}
          showHero
          interactive
          className="h-[260px] w-full"
        />
        <p className="mt-1 text-center text-xs text-muted-foreground">
          <span className="font-semibold" style={{ color: hero.accent }}>{hero.name}</span> en {zoneInfo(current.zone).name}
        </p>
        <div className="mt-2 flex justify-center gap-1.5">
          {SHOWCASE.map((s, i) => (
            <button
              key={s.zone}
              type="button"
              onClick={() => setScene(i)}
              aria-label={`Ver ${zoneInfo(s.zone).name}`}
              aria-pressed={i === scene}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span className={`block h-1.5 rounded-full transition-all ${i === scene ? "w-5 bg-soul-gold" : "w-1.5 bg-muted-foreground/40"}`} />
            </button>
          ))}
        </div>
      </section>

      <p className="relative z-10 mt-3 max-w-[300px] text-center text-sm text-muted-foreground">
        Elige tu héroe, cumple misiones de bienestar y haz florecer tu propio mundo.
      </p>

      <ul className="relative z-10 mt-5 grid w-full max-w-[340px] grid-cols-3 gap-2">
        {FEATURES.map((f) => (
          <li key={f.label} className="flex flex-col items-center gap-1 rounded-xl border border-soul-gold/15 bg-card/50 px-2 py-2.5 text-center backdrop-blur-sm">
            <GameIcon name={f.icon} className="h-6 w-6 text-soul-gold" />
            <span className="text-xs leading-tight text-foreground/90">{f.label}</span>
          </li>
        ))}
      </ul>

      <div className="relative z-10 mt-auto w-full max-w-[300px] pt-8">
        {!checking && (
          <>
            <button
              onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-soul-gold/40 bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-[0_8px_28px_-8px_var(--color-primary)] transition-all hover:brightness-110 active:scale-95"
            >
              <GameIcon name="crossed-swords" className="h-5 w-5" /> Comenzar aventura
            </button>
            <button
              onClick={() => navigate({ to: "/auth", search: { mode: "login" } })}
              className="mt-3 flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Ya tengo cuenta · <span className="ml-1 font-semibold text-soul-gold">Entrar</span>
            </button>
          </>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground/70">Seguro · IA ética · Con evidencia</p>
      </div>
    </div>
  );
}
