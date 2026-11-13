// Indicador del recorrido de la primera vez (cuenta → héroe → primera misión): el estudiante
// siempre sabe en qué paso va y cuánto le falta para empezar a jugar.
import { Check } from "lucide-react";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/domain/identity/onboarding";

export function OnboardingSteps({ current, className = "" }: { current: OnboardingStep; className?: string }) {
  const index = ONBOARDING_STEPS.findIndex((s) => s.key === current);
  return (
    <ol className={`flex items-center gap-2 ${className}`} aria-label={`Paso ${index + 1} de ${ONBOARDING_STEPS.length}`}>
      {ONBOARDING_STEPS.map((s, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={s.key} className="flex min-w-0 flex-1 flex-col items-center gap-1" aria-current={active ? "step" : undefined}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition-all duration-500 ${
              done ? "border-soul-teal bg-soul-teal text-background"
                : active ? "border-soul-gold bg-soul-gold/15 text-soul-gold shadow-[0_0_12px_-2px_var(--color-soul-gold)]"
                : "border-border text-muted-foreground"}`}>
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={`truncate text-[11px] ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
