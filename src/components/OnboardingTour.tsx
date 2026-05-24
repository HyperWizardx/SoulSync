import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUserStore } from "@/hooks/useUserStore";
import { getArchetypeStyle } from "@/lib/archetype";
import { MiniAvatar3D } from "@/components/MiniAvatar3D";
import { ChevronRight, X } from "lucide-react";

const STEPS = [
  {
    title: "Tu Dashboard",
    body: "Aquí ves tus stats emocionales en tiempo real: bienestar, resiliencia, energía y claridad.",
    emoji: "📊",
  },
  {
    title: "Misiones diarias",
    body: "Completa misiones (respiración, diario, AR…) para ganar XP, monedas y subir tus atributos.",
    emoji: "⚔️",
  },
  {
    title: "Realidad aumentada",
    body: "Las misiones AR usan la cámara de tu móvil y tu avatar 3D. Vívelas en tu espacio real.",
    emoji: "📱",
  },
  {
    title: "Tu progreso, persistente",
    body: "Todo se guarda en la nube. Vuelve mañana para mantener tu racha y desbloquear logros.",
    emoji: "🔥",
  },
] as const;

const WELCOMES = [
  "Tu fuerza despierta, Guerrero. Que cada batalla te haga más fuerte.",
  "La calma te guía, Sanador. Lleva paz a donde vayas.",
  "El camino te llama, Explorador. Descubre nuevos horizontes interiores.",
  "El conocimiento es tu aliado, Sabio. Reflexiona y crece.",
];

export function OnboardingTour() {
  const { user, updateSettings } = useUserStore();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const style = getArchetypeStyle(user.archetype);
  const welcome = user.archetype !== null ? WELCOMES[user.archetype] : "Tu aventura comienza ahora.";

  if (user.settings.onboarded) return null;
  if (user.archetype === null) return null; // espera a que cree avatar

  const finish = () => {
    updateSettings({ onboarded: true });
    navigate({ to: "/missions" });
  };

  const isWelcome = step === 0;
  const tourStep = isWelcome ? null : STEPS[step - 1];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de bienvenida"
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-primary/30 bg-card p-6 shadow-2xl shadow-primary/20 animate-scale-in">
        <button
          onClick={finish}
          aria-label="Saltar tutorial"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition min-h-11 min-w-11"
        >
          <X className="h-4 w-4" />
        </button>

        {isWelcome ? (
          <div className="text-center">
            <div className="mx-auto flex justify-center">
              <MiniAvatar3D size={150} glowColor={style.glow} exposure={style.exposure} />
            </div>
            <h2 className="mt-4 font-cinzel text-2xl font-bold text-foreground">
              Bienvenido, {user.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground italic px-2">{welcome}</p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-5xl">{tourStep!.emoji}</span>
            <h2 className="mt-4 font-cinzel text-xl font-bold text-foreground">
              {tourStep!.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{tourStep!.body}</p>
          </div>
        )}

        {/* progress dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {Array.from({ length: STEPS.length + 1 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-secondary"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 rounded-xl border border-border bg-card py-3 text-sm text-foreground hover:bg-secondary transition active:scale-95 min-h-11"
            >
              Atrás
            </button>
          )}
          {step < STEPS.length ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-95 hover:brightness-110 min-h-11"
            >
              {isWelcome ? "Empezar tour" : "Siguiente"}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-95 hover:brightness-110 min-h-11"
            >
              ¡A jugar!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
