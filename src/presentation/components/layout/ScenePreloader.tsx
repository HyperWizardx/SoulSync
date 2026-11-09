// Precarga en segundo plano los modelos 3D: el personaje del usuario al iniciar sesión y el kit
// del Mundo al entrar a Misiones o Mundo, cuando el navegador está libre.
import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useUserStore } from "@/presentation/hooks/useUserStore";

const whenIdle = (task: () => void) => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(task, { timeout: 4000 });
  else setTimeout(task, 1500);
};
const loadScene = () => import("@/presentation/components/avatars/ArchetypeScene");

export function ScenePreloader() {
  const { user } = useUserStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (user.archetype === null) return;
    whenIdle(() => { void loadScene().then((m) => m.preloadArchetype(user.archetype)); });
  }, [user.archetype]);

  useEffect(() => {
    if (pathname !== "/missions" && pathname !== "/world") return;
    whenIdle(() => { void loadScene().then((m) => m.preloadWorldKit()); });
  }, [pathname]);

  return null;
}
