/** Control compacto de paisaje sonoro para misiones de respiración, meditación y enfoque. */
import { useEffect } from "react";
import { Volume2 } from "lucide-react";
import { SOUNDSCAPES, useSoundscape } from "@/presentation/hooks/useSoundscape";

export function SoundscapeControl({ stopped = false }: { stopped?: boolean }) {
  const s = useSoundscape();
  const { kind, stop } = s;
  useEffect(() => {
    if (stopped && kind !== "off") stop();
  }, [stopped, kind, stop]);
  const binaural = s.kind === "alpha" || s.kind === "theta";
  return (
    <div className="w-full max-w-xs rounded-2xl border border-border bg-card/80 p-3">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" aria-hidden />
        <select
          aria-label="Paisaje sonoro"
          value={s.kind}
          onChange={(e) => s.play(e.target.value as typeof s.kind)}
          className="h-9 flex-1 rounded-lg border border-border bg-secondary/40 px-2 text-xs text-foreground outline-none focus:border-primary"
        >
          {SOUNDSCAPES.map((o) => (
            <option key={o.key} value={o.key}>{o.emoji} {o.label}</option>
          ))}
        </select>
      </div>
      {s.kind !== "off" && (
        <input
          type="range"
          aria-label="Volumen"
          min={0}
          max={1}
          step={0.05}
          value={s.volume}
          onChange={(e) => s.setVolume(Number(e.target.value))}
          className="mt-2 w-full accent-primary"
        />
      )}
      {binaural && <p className="mt-1 text-[10px] text-muted-foreground">Usa audífonos para percibir el tono binaural.</p>}
    </div>
  );
}
