import { useEffect, useState } from "react";
import { ARMissionHost, AvatarOverlay } from "./ARMission";

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const TOTAL = 30;

export function ARFocusMission({ onComplete, onClose }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    if (elapsed >= TOTAL) {
      const t = setTimeout(onComplete, 500);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => {
      if (focused) setElapsed((e) => Math.min(TOTAL, e + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [elapsed, focused, onComplete]);

  const progress = elapsed / TOTAL;

  return (
    <ARMissionHost title="Enfoque consciente" onClose={onClose}>
      {() => (
        <div className="flex flex-1 flex-col">
          {/* Frame guide */}
          <div className="pointer-events-none relative flex flex-1 items-center justify-center">
            <div
              className={`absolute h-64 w-64 rounded-3xl border-4 transition-colors ${
                focused ? "border-soul-teal/80" : "border-destructive/80"
              }`}
            />
            <AvatarOverlay scale={1 + progress * 0.2} glow="hsl(160 80% 55%)" />
          </div>

          <div className="pointer-events-auto mx-4 mb-6 rounded-2xl bg-black/60 p-4 text-center text-white backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-white/60">Mantén el avatar centrado</p>
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
              {focused ? "🟢 Centrado — pulsa si lo pierdes" : "🔴 Reanudar enfoque"}
            </button>
          </div>
        </div>
      )}
    </ARMissionHost>
  );
}
