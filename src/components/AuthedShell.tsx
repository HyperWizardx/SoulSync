import { SettingsApplier } from "@/components/SettingsApplier";
import { OnboardingGate } from "@/components/OnboardingGate";
import { OnboardingTour } from "@/components/OnboardingTour";
import { FeedbackHost } from "@/components/FeedbackHost";
import { useAuthSession } from "@/components/AuthSessionProvider";

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
