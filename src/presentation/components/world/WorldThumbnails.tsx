// Carga (solo en el navegador) el lienzo compartido que dibuja los dioramas de las tarjetas del Mundo.
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import type { ThumbnailItem } from "@/presentation/components/world/WorldDioramaScene";
import type { WorldSeason } from "@/domain/world/world";

const WorldThumbnailsCanvas = lazy(() => import("@/presentation/components/world/WorldDioramaScene").then((m) => ({ default: m.WorldThumbnailsCanvas })));

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function WorldThumbnails({ items, season, onReady }: { items: ThumbnailItem[]; season: WorldSeason; onReady?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <SceneBoundary>
      <Suspense fallback={null}><WorldThumbnailsCanvas items={items} season={season} onReady={onReady} /></Suspense>
    </SceneBoundary>
  );
}
