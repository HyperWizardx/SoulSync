import { useEffect, useState } from "react";
import { ARMissionHost, AvatarOverlay } from "@/presentation/components/missions/ARMission";
import type { ZoneKey } from "@/domain/world/dioramas";
import { useMissionFinale } from "@/presentation/hooks/useMissionFinale";

interface Props {
  onComplete: () => void;
  onAchieved?: () => void; // objetivo logrado: anuncia "¡Misión cumplida!" antes de la celebración
  onClose: () => void;
  zone?: ZoneKey | null; // zona del Mundo en la que se ambienta
}

const TOTAL = 30;

export function ARFocusMission({ onComplete, onAchieved, onClose, zone }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [focused, setFocused] = useState(true);
  const celebrate = useMissionFinale(elapsed >= TOTAL, onComplete, onAchieved);

  useEffect(() => {
    if (elapsed >= TOTAL) return;
    const id = setInterval(() => {
      if (focused) setElapsed((e) => Math.min(TOTAL, e + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [elapsed, focused]);

  const progress = elapsed / TOTAL;

  return (
    <ARMissionHost title="Enfoque consciente" onClose={onClose} zone={zone}>
      {() => (
        <div className="flex flex-1 flex-col">
          {/* Frame guide */}
          <div className="relative flex flex-1 items-center justify-center">
            <div
              className={`pointer-events-none absolute h-64 w-64 rounded-3xl border-4 transition-colors ${
                focused ? "border-soul-teal/80" : "border-destructive/80"
              }`}
            />
            <AvatarOverlay scale={1 + progress * 0.2} celebrate={celebrate} zone={zone} />
          </div>

          <div className="pointer-events-auto mx-4 mb-6 rounded-2xl bg-black/60 p-4 text-center text-white backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-white/60">Mantén el avatar centrado</p>
            <p className="mt-1 text-3xl font-cinzel font-bold">{elapsed}s / {TOTAL}s</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-soul-teal transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <button
              onClick={() => setFocused((f) => !f)}
              className={`mt-3 w-full rounded-lg py-2 text-xs font-semibold transition ${
                focused
                  ? "bg-soul-teal/20 text-soul-teal"
                  : "bg-destructive/30 text-destructive-foreground"
              }`}
            >
              <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${focused ? "bg-soul-teal" : "bg-destructive"}`} />{focused ? "Centrado: pulsa si lo pierdes" : "Reanudar enfoque"}
            </button>
          </div>
        </div>
      )}
    </ARMissionHost>
  );
}
