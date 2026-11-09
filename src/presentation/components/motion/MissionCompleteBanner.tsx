// Aviso "¡Misión cumplida!": aparece al instante al terminar cualquier misión, con el ícono de la
// misión en un sello dorado, destellos y una frase motivadora. Se va solo (o al tocarlo) y luego
// sigue el flujo de siempre: celebración del personaje, recompensas y vuelta a la zona.
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { MISSION_BANNER_MS, missionCheer, onFeedback } from "@/shared/feedback";
import { fireConfetti } from "@/shared/confetti";
import { playSound } from "@/shared/sound";
import { success as hapticSuccess } from "@/shared/haptics";

type Shown = { id: number; title: string; icon: string; cheer: string };

const SPARKS = [
  { x: -96, y: -64, d: 0.05 }, { x: 98, y: -54, d: 0.12 }, { x: -78, y: 58, d: 0.2 },
  { x: 86, y: 66, d: 0.08 }, { x: 0, y: -104, d: 0.16 }, { x: -116, y: 6, d: 0.24 }, { x: 118, y: 4, d: 0.1 },
];

export function MissionCompleteBanner() {
  const [shown, setShown] = useState<Shown | null>(null);

  useEffect(() => onFeedback((e) => {
    if (e.type !== "missionComplete") return;
    playSound("complete");
    hapticSuccess();
    fireConfetti({ particleCount: 70, spread: 80, startVelocity: 35, origin: { y: 0.45 }, colors: ["#f5c451", "#fde68a", "#a78bfa", "#5eead4"] });
    setShown({ id: Date.now(), title: e.title, icon: e.icon, cheer: missionCheer() });
  }), []);

  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(null), MISSION_BANNER_MS);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <AnimatePresence>
      {shown && (
        <m.div
          key={shown.id}
          role="status"
          aria-live="assertive"
          onClick={() => setShown(null)}
          className="fixed inset-0 z-[62] flex items-center justify-center bg-black/55 px-6 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <m.div
            className="relative w-full max-w-xs rounded-3xl border-2 border-soul-gold/60 bg-gradient-to-b from-card via-card to-soul-gold/10 px-6 pb-6 pt-14 text-center shadow-[0_0_48px_-8px_var(--color-soul-gold)]"
            initial={{ scale: 0.6, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
          >
            {/* Sello con el ícono de la misión, rayos girando y destellos */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <m.div
                aria-hidden
                className="absolute inset-[-22px] rounded-full opacity-70"
                style={{ background: "conic-gradient(from 0deg, transparent 0 10%, var(--color-soul-gold) 12%, transparent 14% 35%, var(--color-soul-gold) 37%, transparent 39% 60%, var(--color-soul-gold) 62%, transparent 64% 85%, var(--color-soul-gold) 87%, transparent 89%)", maskImage: "radial-gradient(circle, transparent 45%, black 46%, transparent 72%)", WebkitMaskImage: "radial-gradient(circle, transparent 45%, black 46%, transparent 72%)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, ease: "linear", repeat: Infinity }}
              />
              <m.div
                className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-soul-gold bg-gradient-to-br from-soul-gold/40 via-card to-primary/30 text-soul-gold shadow-lg"
                initial={{ rotate: -25, scale: 0.4 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.05 }}
              >
                <GameIcon name={shown.icon} className="h-12 w-12" />
              </m.div>
              {SPARKS.map((s, i) => (
                <m.span
                  key={i}
                  aria-hidden
                  className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-soul-gold"
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0.4, 1.2, 0.6] }}
                  transition={{ duration: 1.1, delay: 0.15 + s.d, ease: "easeOut" }}
                />
              ))}
            </div>

            <m.p
              className="font-cinzel text-2xl font-bold text-soul-gold drop-shadow"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              ¡Misión cumplida!
            </m.p>
            <m.p
              className="mt-1 text-sm font-semibold text-foreground"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              {shown.title}
            </m.p>
            <m.p
              className="mt-2 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {shown.cheer}
            </m.p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
