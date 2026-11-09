import { useEffect, useState } from "react";
import { ARMissionHost, AvatarOverlay } from "@/presentation/components/missions/ARMission";
import type { ZoneKey } from "@/domain/world/dioramas";

interface Props {
  onComplete: () => void;
  onClose: () => void;
  zone?: ZoneKey | null; // zona del Mundo en la que se ambienta
}

const TARGET = 10;

export function AREnergyMission({ onComplete, onClose, zone }: Props) {
  const [taps, setTaps] = useState(0);
  const [boom, setBoom] = useState(false);

  useEffect(() => {
    if (taps >= TARGET) {
      const t = setTimeout(onComplete, 1600); // deja ver la celebración del personaje
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
    <ARMissionHost title="Captura de energía" onClose={onClose} zone={zone}>
      {() => (
        <>
          <AvatarOverlay scale={scale} onTap={handleTap} tapLabel="Cargar energía de tu personaje" celebrate={taps >= TARGET} zone={zone} />
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
            <p className="mt-2 text-xs text-white/70">Toca a tu personaje para cargarlo de energía ⚡</p>
          </div>
        </>
      )}
    </ARMissionHost>
  );
}
