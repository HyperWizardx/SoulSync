// Bienvenida de la primera vez, en 3 pantallas: el héroe celebra, la aventura en 4 lugares y la
// primera misión sugerida (corta y propia o afín al arquetipo), que se abre con un toque.
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUserStore } from "@/presentation/hooks/useUserStore";
import { AFFINITY_XP_MULT, getArchetypeStyle, isAffine, withAlpha } from "@/domain/identity/archetype";
import { estimateMinutes, missionCategory } from "@/domain/gamification/missionsData";
import { firstMissionFor } from "@/domain/identity/onboarding";
import { MiniAvatar3D } from "@/presentation/components/layout/MiniAvatar3D";
import { OnboardingSteps } from "@/presentation/components/layout/OnboardingSteps";
import { fireConfetti } from "@/shared/confetti";
import { ChevronRight, Clock, X } from "lucide-react";

const PLACES = [
  { title: "Misiones", body: "Respira, escribe, muévete o conecta: ganas XP y monedas.", icon: "crossed-swords" },
  { title: "Tu Mundo", body: "Cada misión hace florecer tus tierras.", icon: "treasure-map" },
  { title: "Tu brújula", body: "En Bienestar activa tu brújula y haz tu check-in.", icon: "compass" },
  { title: "Racha y logros", body: "Vuelve cada día y desbloquea trofeos.", icon: "flame" },
] as const;

const WELCOMES = [
  "Tu fuerza despierta, Caballero. Que cada batalla te haga más fuerte.",
  "Tu energía es imparable, Bárbaro. Enfréntate a cada reto con coraje.",
  "El camino te llama, Pícaro. Descubre nuevos horizontes interiores.",
  "El conocimiento es tu aliado, Mago. Reflexiona y crece.",
];

const SCREENS = 3;

export function OnboardingTour() {
  const { user, updateSettings } = useUserStore();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const style = getArchetypeStyle(user.archetype);
  const welcome = user.archetype !== null ? WELCOMES[user.archetype] : "Tu aventura comienza ahora.";
  const first = useMemo(() => firstMissionFor(user.archetype), [user.archetype]);
  const visible = !user.settings.onboarded && user.archetype !== null;

  // Un estallido de celebración al conocer a su héroe (se omite con movimiento reducido).
  useEffect(() => {
    if (visible && step === 0) fireConfetti({ particleCount: 70, spread: 70, origin: { y: 0.45 }, colors: ["#f5c542", "#8b5cf6", "#2dd4bf"] });
  }, [visible, step]);

  if (!visible) return null;

  const finish = (startMission: boolean) => {
    updateSettings({ onboarded: true });
    if (startMission && first) navigate({ to: "/missions", search: { mission: first.id } });
  };

  const affine = first ? isAffine(user.archetype, missionCategory(first)) : false;
  const xp = first ? Math.round((first.reward.xp ?? 0) * (affine ? AFFINITY_XP_MULT : 1)) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida a tu aventura"
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-primary/30 bg-card p-6 shadow-2xl shadow-primary/20 animate-scale-in">
        <button
          onClick={() => finish(false)}
          aria-label="Saltar bienvenida"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition min-h-11 min-w-11"
        >
          <X className="h-4 w-4" />
        </button>

        <OnboardingSteps current="mision" className="mb-4 pr-8" />

        <div key={step} className="animate-fade-in">
          {step === 0 && (
            <div className="text-center">
              <div className="mx-auto flex justify-center">
                <MiniAvatar3D archetype={user.archetype} size={150} glowColor={style.glow} exposure={style.exposure} celebrating />
              </div>
              <h2 className="mt-3 font-cinzel text-2xl font-bold text-foreground">¡Te damos la bienvenida, {user.name}!</h2>
              <p className="mt-2 px-2 text-sm italic text-muted-foreground">{welcome}</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-center font-cinzel text-xl font-bold text-foreground">Tu aventura en 4 lugares</h2>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {PLACES.map((p) => (
                  <li key={p.title} className="rounded-xl border border-border bg-secondary/40 p-3">
                    <GameIcon name={p.icon} className="h-6 w-6 text-primary" />
                    <p className="mt-1.5 text-sm font-semibold text-foreground">{p.title}</p>
                    <p className="text-xs leading-snug text-muted-foreground">{p.body}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-center text-xs text-soul-gold">Las misiones afines a tu {style.name} dan +{Math.round((AFFINITY_XP_MULT - 1) * 100)} % de XP.</p>
            </div>
          )}

          {step === 2 && first && (
            <div className="text-center">
              <h2 className="font-cinzel text-xl font-bold text-foreground">Tu primera misión</h2>
              <p className="mt-1 text-sm text-muted-foreground">Elegida para tu {style.name}: corta y lista para empezar ya.</p>
              <div
                className="mt-4 flex items-center gap-3 rounded-2xl border-2 p-3 text-left"
                style={{ borderColor: withAlpha(style.accent, 0.6), backgroundColor: withAlpha(style.accent, 0.1) }}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(style.accent, 0.18), color: style.accent }}>
                  <GameIcon name={first.icon} className="h-7 w-7" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{first.title}</span>
                  <span className="block text-xs text-muted-foreground">{first.desc}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" aria-hidden /> {estimateMinutes(first)} min</span>
                    <span className="font-semibold text-soul-gold">+{xp} XP</span>
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          {step > 0 && step < SCREENS - 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 rounded-xl border border-border bg-card py-3 text-sm text-foreground hover:bg-secondary transition active:scale-95 min-h-11">
              Atrás
            </button>
          )}
          {step < SCREENS - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-95 hover:brightness-110 min-h-11"
            >
              {step === 0 ? "Conocer mi aventura" : "Continuar"}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <button
                onClick={() => finish(true)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-95 hover:brightness-110"
              >
                <GameIcon name="crossed-swords" className="h-4 w-4" /> ¡Empezar ahora!
              </button>
              <button onClick={() => finish(false)} className="min-h-10 w-full rounded-xl text-sm text-muted-foreground hover:text-foreground">
                Explorar por mi cuenta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
