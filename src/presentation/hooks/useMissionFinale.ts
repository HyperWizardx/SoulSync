// Final de las misiones AR: al lograr el objetivo se anuncia "¡Misión cumplida!" (onAchieved),
// después el personaje celebra y, al terminar, se completa la misión. Las callbacks se leen de
// una ref para que un re-render de la pantalla no reinicie los tiempos.
import { useEffect, useRef, useState } from "react";
import { AVATAR_CELEBRATION_MS, MISSION_BANNER_MS } from "@/shared/feedback";

export function useMissionFinale(done: boolean, onComplete: () => void, onAchieved?: () => void): boolean {
  const [celebrate, setCelebrate] = useState(false);
  const callbacks = useRef({ onComplete, onAchieved });
  callbacks.current = { onComplete, onAchieved };

  useEffect(() => {
    if (!done) return;
    callbacks.current.onAchieved?.();
    const bannerMs = callbacks.current.onAchieved ? MISSION_BANNER_MS : 0;
    const t1 = setTimeout(() => setCelebrate(true), bannerMs);
    const t2 = setTimeout(() => callbacks.current.onComplete(), bannerMs + AVATAR_CELEBRATION_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [done]);

  return celebrate;
}
