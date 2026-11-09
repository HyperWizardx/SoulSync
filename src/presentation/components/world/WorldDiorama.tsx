// Contenedor del diorama 3D de una zona: carga la escena solo en el navegador, muestra un
// respaldo con el ícono de la zona si falla y atenúa las zonas bloqueadas.
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import type { ZoneKey } from "@/domain/world/dioramas";
import type { WorldSeason } from "@/domain/world/world";

const WorldDioramaScene = lazy(() => import("@/presentation/components/world/WorldDioramaScene"));

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

interface Props {
  zone: ZoneKey;
  icon: string;
  progress: number;
  unlocked: boolean;
  season: WorldSeason;
  archetype?: number | null;
  showHero?: boolean;
  interactive?: boolean;
  className?: string;
}

export function WorldDiorama({ icon, className = "", ...scene }: Props) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setMounted(true), []);
  const fallback = <div className="absolute inset-0 flex items-center justify-center text-muted-foreground" aria-hidden>{scene.unlocked ? <GameIcon name={icon} className="h-10 w-10" /> : <Lock className="h-8 w-8" />}</div>;

  return (
    <div className={`relative overflow-hidden ${className}`} data-zone-diorama={scene.zone} data-scene-ready={ready ? "true" : undefined}>
      <div className="absolute inset-0" style={scene.unlocked ? undefined : { filter: "grayscale(1) brightness(0.55)" }}>
        {!ready && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-60" aria-hidden><GameIcon name={icon} className="h-8 w-8" /></div>}
        {mounted && (
          <SceneBoundary fallback={fallback}>
            <Suspense fallback={null}><WorldDioramaScene {...scene} onReady={() => setReady(true)} /></Suspense>
          </SceneBoundary>
        )}
      </div>
      {!scene.unlocked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow"><Lock className="h-4 w-4" aria-hidden /></span>
        </div>
      )}
    </div>
  );
}
