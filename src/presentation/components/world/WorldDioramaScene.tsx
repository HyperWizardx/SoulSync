// Escena 3D (solo navegador) de un diorama del Mundo: losetas hexagonales KayKit, piezas
// que aparecen con el progreso, luz y niebla según la estación y, opcionalmente, el personaje.
import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Color, Fog, type Object3D } from "three";
import { DIORAMAS, hexToWorld, visiblePieces, type HexCoord, type ZoneKey } from "@/domain/world/dioramas";
import type { WorldSeason } from "@/domain/world/world";
import { isMotionReduced } from "@/shared/devicePrefs";
import { ArchetypeCharacter } from "@/presentation/components/avatars/ArchetypeScene";
import { WORLD_KIT_URL, cloneKitPiece } from "@/presentation/components/world/worldKit";


// Ambientación por estación (la estación sale de deriveWorldState).
const AMBIENCE: Record<WorldSeason, { ambient: number; sun: number; sunColor: string; sky: string; ground: string; fog?: [string, number, number]; clouds: number }> = {
  calma: { ambient: 0.75, sun: 1.3, sunColor: "#fff6e8", sky: "#dbe8ff", ground: "#5b6f4a", clouds: 1 },
  crecimiento: { ambient: 0.85, sun: 1.5, sunColor: "#fffaf0", sky: "#e2f7dc", ground: "#5f7a48", clouds: 0 },
  tormenta: { ambient: 0.45, sun: 0.6, sunColor: "#b8c4e0", sky: "#5a6a8f", ground: "#2e3b2a", fog: ["#2a3350", 10, 24], clouds: 3 },
  niebla: { ambient: 0.65, sun: 0.7, sunColor: "#e3e6ec", sky: "#c9ced8", ground: "#5d6b5a", fog: ["#9aa3b2", 8, 18], clouds: 2 },
};

function Piece({ kit, model, coord, rotation = 0, scale = 1, offset = [0, 0], y = 0 }: { kit: Object3D; model: string; coord: HexCoord; rotation?: number; scale?: number; offset?: [number, number]; y?: number }) {
  const object = useMemo(() => cloneKitPiece(kit, model), [kit, model]);
  if (!object) return null;
  const { x, z } = hexToWorld(coord);
  return <primitive object={object} position={[x + offset[0], y, z + offset[1]]} rotation={[0, (rotation * Math.PI) / 180, 0]} scale={scale} />;
}

function Clouds({ kit, count }: { kit: Object3D; count: number }) {
  const spots: [number, number, number][] = [[2.8, 2.2, -3.6], [-3, 2.6, -3.2], [0.3, 2.9, -4.4]];
  return <>{spots.slice(0, count).map((p, i) => <Piece key={i} kit={kit} model={i % 2 ? "cloud_small" : "cloud_big"} coord={{ q: 0, r: 0 }} offset={[p[0], p[2]]} y={p[1]} scale={0.6} />)}</>;
}

function Diorama({ zone, progress, unlocked, season, archetype, showHero, onReady }: Props) {
  const { scene } = useGLTF(WORLD_KIT_URL);
  const layout = DIORAMAS[zone];
  const pieces = visiblePieces(layout, progress, unlocked);
  const ambience = AMBIENCE[season];
  useEffect(() => { onReady?.(); }, [onReady]);
  const hero = hexToWorld(layout.hero);
  return (
    <group position={[0, -0.3, 0]}>
      <hemisphereLight args={[ambience.sky, ambience.ground, ambience.ambient]} />
      <directionalLight position={[4, 8, 5]} intensity={ambience.sun} color={ambience.sunColor} />
      {layout.ground.map((g) => <Piece key={`g${g.q},${g.r}`} kit={scene} model={g.model} coord={g} />)}
      {pieces.map((p) => <Piece key={`${p.model}${p.q},${p.r}`} kit={scene} model={p.model} coord={p} rotation={p.rotation} scale={p.scale} offset={p.offset} />)}
      {unlocked && <Clouds kit={scene} count={ambience.clouds} />}
      {showHero && unlocked && (
        // El personaje (normalizado a 2 de alto con los pies en y = -1) se reduce y se centra en su casilla libre.
        <group position={[hero.x, 0.5, hero.z]} scale={0.5}>
          <ArchetypeCharacter archetype={archetype} reducedMotion={false} />
        </group>
      )}
    </group>
  );
}

interface Props {
  zone: ZoneKey;
  progress: number;
  unlocked: boolean;
  season: WorldSeason;
  archetype?: number | null;
  showHero?: boolean;
  interactive?: boolean;  // detalle: se puede girar con el dedo
  onReady?: () => void;
}

export default function WorldDioramaScene(props: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => { setReducedMotion(isMotionReduced()); }, []);
  const ambience = AMBIENCE[props.season];
  return (
    <Canvas
      frameloop={props.interactive || props.showHero ? "always" : "demand"}
      camera={{ position: [0, 6.6, 9], fov: 34 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ scene, camera }) => {
        camera.lookAt(0, 0.3, 0);
        scene.fog = ambience.fog ? new Fog(new Color(ambience.fog[0]), ambience.fog[1], ambience.fog[2]) : null;
      }}
    >
      <Suspense fallback={null}><Diorama {...props} /></Suspense>
      {props.interactive && (
        <OrbitControls enablePan={false} enableZoom={false} target={[0, 0.3, 0]} autoRotate={!reducedMotion} autoRotateSpeed={0.6} minPolarAngle={Math.PI / 5} maxPolarAngle={Math.PI / 2.6} />
      )}
    </Canvas>
  );
}
