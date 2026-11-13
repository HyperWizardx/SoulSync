// Visor compartido por Inicio, Perfil y misiones; el 3D se carga solo en el navegador.
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { getArchetypeStyle } from "@/domain/identity/archetype";
import type { ZoneKey } from "@/domain/world/dioramas";
const ArchetypeScene = lazy(() => import("@/presentation/components/avatars/ArchetypeScene"));

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

interface Props {
  size?: number;
  rotate?: boolean;
  glowColor?: string;
  className?: string;
  scale?: number;
  exposure?: number;
  archetype?: number | null;
  interactive?: boolean;
  walking?: boolean;
  celebrating?: boolean;
  facing?: number;
  zone?: ZoneKey | null;
  gestures?: boolean;
}

export function MiniAvatar3D({
  size = 180,
  rotate = true,
  glowColor,
  className = "",
  scale = 1,
  exposure = 1.1,
  archetype,
  interactive = true,
  walking = false,
  celebrating = false,
  facing = 0,
  zone = null,
  gestures = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => { setMounted(true); const t = setTimeout(() => setSlow(true), 12000); return () => clearTimeout(t); }, []);
  const style = getArchetypeStyle(archetype);
  const fallback = <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground"><GameIcon name={style.icon} className="h-8 w-8" style={{ color: style.accent }} /><span>Tu héroe descansa por ahora</span></div>;

  return (
    <div
      data-avatar-archetype={style.name}
      data-scene-ready={ready ? "true" : undefined}
      className={`relative transition-transform duration-300 ease-out ${className}`}
      style={{ width: size, height: size, transform: `scale(${scale})`, maxWidth: "100%" }}
    >
      {/* Con isla de zona el personaje ya tiene suelo: no se dibuja la sombra de color. */}
      {!zone && <div className="avatar-ground absolute inset-x-8 bottom-3 h-3 rounded-full opacity-60" style={{ background: glowColor ?? style.glow }} />}
      {!ready && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground" role="status">{slow ? "Tu héroe viene en camino…" : "Invocando a tu héroe…"}</div>}
      {mounted && <SceneBoundary key={archetype} fallback={fallback}><Suspense fallback={null}><ArchetypeScene archetype={archetype} rotate={rotate} interactive={interactive} walking={walking} celebrating={celebrating} facing={facing} zone={zone} gestures={gestures} exposure={exposure} onReady={() => setReady(true)} /></Suspense></SceneBoundary>}
    </div>
  );
}
