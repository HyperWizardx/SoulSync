import { useEffect, useState } from "react";
import { ARMissionHost, AvatarOverlay } from "./ARMission";

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const PHASES = [
  { label: "Inhala", ms: 4000, scale: 1.3 },
  { label: "Mantén", ms: 2000, scale: 1.3 },
  { label: "Exhala", ms: 4000, scale: 0.85 },
];
const CYCLES = 4;

export function ARAuraMission({ onComplete, onClose }: Props) {
  const [cycle, setCycle] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    if (cycle >= CYCLES) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
    const phase = PHASES[phaseIdx];
    const t = setTimeout(() => {
      const nextPhase = (phaseIdx + 1) % PHASES.length;
      setPhaseIdx(nextPhase);
      if (nextPhase === 0) setCycle((c) => c + 1);
    }, phase.ms);
    return () => clearTimeout(t);
  }, [cycle, phaseIdx, onComplete]);

  const phase = PHASES[phaseIdx];
  const progress = Math.min(cycle / CYCLES, 1);

  return (
    <ARMissionHost title="Aura serena" onClose={onClose}>
      {() => (
        <>
          <AvatarOverlay scale={phase.scale} glow="hsl(180 70% 60%)" />
          <div className="relative z-10 mx-4 mb-6 rounded-2xl bg-black/60 p-4 text-center text-white backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-white/60">
              Ciclo {Math.min(cycle + 1, CYCLES)} / {CYCLES}
            </p>
            <p className="mt-1 text-3xl font-cinzel font-bold">{phase.label}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-soul-teal transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/70">Respira al ritmo del aura del avatar</p>
          </div>
        </>
      )}
    </ARMissionHost>
  );
}
