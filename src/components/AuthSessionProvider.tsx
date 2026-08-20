import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuthSessionState {
  session: Session | null;
  hasSession: boolean;
  /** true únicamente hasta que se resuelve el primer getSession(). */
  isCheckingSession: boolean;
}

const AuthSessionContext = createContext<AuthSessionState | null>(null);

/**
 * Única fuente de verdad para "¿hay sesión activa?" en toda la app.
 *
 * Antes había TRES implementaciones independientes de este mismo chequeo
 * (AuthedShell, useUserStore, MobileLayout), cada una con su propio
 * getSession() + onAuthStateChange() y su propio estado local. Como cada
 * una resolvía en un instante ligeramente distinto, esto fue la causa raíz
 * de más de un bug de "rebote" difícil de reproducir (ver commits
 * 095eaa5 y 52edc41). Con un solo Provider montado una vez en la raíz,
 * todos los componentes leen exactamente el mismo estado, al mismo tiempo.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [state, setState] = useState<AuthSessionState>({
    session: null,
    hasSession: false,
    isCheckingSession: true,
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({ session: data.session, hasSession: !!data.session, isCheckingSession: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({ session, hasSession: !!session, isCheckingSession: false });
      // Antes vivía en <AuthSync /> en __root.tsx; se absorbe aquí para que
      // solo haya una suscripción a onAuthStateChange en toda la app.
      qc.invalidateQueries();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  return <AuthSessionContext.Provider value={state}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession() debe usarse dentro de <AuthSessionProvider>");
  }
  return ctx;
}
