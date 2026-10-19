import { SettingsApplier } from "@/presentation/components/layout/SettingsApplier";
import { OnboardingGate } from "@/presentation/components/layout/OnboardingGate";
import { OnboardingTour } from "@/presentation/components/layout/OnboardingTour";
import { FeedbackHost } from "@/presentation/components/layout/FeedbackHost";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";

/**
 * Solo monta los componentes que dependen de datos del usuario (y por tanto
 * disparan server functions protegidas) cuando hay una sesión activa.
 * Esto evita que la pantalla pública (splash, auth) lance peticiones 401
 * que rompen la app antes de iniciar sesión.
 */
export function AuthedShell() {
  const { hasSession } = useAuthSession();

  if (!hasSession) return null;
  return (
    <>
      <SettingsApplier />
      <OnboardingGate />
      <OnboardingTour />
      <FeedbackHost />
    </>
  );
}
