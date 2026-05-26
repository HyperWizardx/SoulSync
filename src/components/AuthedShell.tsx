import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SettingsApplier } from "@/components/SettingsApplier";
import { OnboardingTour } from "@/components/OnboardingTour";
import { FeedbackHost } from "@/components/FeedbackHost";

/**
 * Solo monta los componentes que dependen de datos del usuario (y por tanto
 * disparan server functions protegidas) cuando hay una sesión activa.
 * Esto evita que la pantalla pública (splash, auth) lance peticiones 401
 * que rompen la app antes de iniciar sesión.
 */
export function AuthedShell() {
  const [hasSession, setHasSession] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setHasSession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!hasSession) return null;
  return (
    <>
      <SettingsApplier />
      <OnboardingTour />
      <FeedbackHost />
    </>
  );
}
