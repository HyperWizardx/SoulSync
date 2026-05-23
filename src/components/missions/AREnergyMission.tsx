import { useEffect, useState } from "react";
import { ARMissionHost, AvatarOverlay } from "./ARMission";

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const TARGET = 10;

export function AREnergyMission({ onComplete, onClose }: Props) {
  const [taps, setTaps] = useState(0);
  const [boom, setBoom] = useState(false);

  useEffect(() => {
    if (taps >= TARGET) {
      const t = setTimeout(onComplete, 700);
      return () => clearTimeout(t);
    }
  }, [taps, onComplete]);

  const handleTap = () => {
    setTaps((t) => Math.min(TARGET, t + 1));
    setBoom(true);
    setTimeout(() => setBoom(false), 180);
  };

  const charge = taps / TARGET;
  const scale = 1 + charge * 0.5 + (boom ? 0.15 : 0);

  return (
    <ARMissionHost title="Captura de energía" onClose={onClose}>
      {() => (
        <>
          <button
            onClick={handleTap}
            className="pointer-events-auto flex flex-1 items-center justify-center"
          >
            <AvatarOverlay scale={scale} />
          </button>
          <div className="relative z-10 mx-4 mb-6 rounded-2xl bg-black/60 p-4 text-center text-white backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-white/60">Carga</p>
            <p className="mt-1 text-3xl font-cinzel font-bold">
              {taps} / {TARGET}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-soul-gold transition-all duration-200"
                style={{ width: `${charge * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/70">Toca al avatar para cargarlo de energía ⚡</p>
          </div>
        </>
      )}
    </ARMissionHost>
  );
}
