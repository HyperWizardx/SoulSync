// Renderiza una copia independiente del personaje medieval del arquetipo y reproduce
// sus animaciones reales (reposo, caminar, celebrar). Modelos: KayKit Adventurers (CC0).
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Box3, Group, LoopOnce, LoopRepeat, MathUtils, Vector3, type Mesh, type MeshStandardMaterial, type Object3D } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { archetypeModelKey, avatarAnimation } from "@/domain/identity/avatarMotion";
import { AR_PLATFORMS, type ZoneKey } from "@/domain/world/dioramas";
import { WORLD_KIT_URL, cloneKitPiece } from "@/presentation/components/world/worldKit";

const MODEL_URL = (key: ReturnType<typeof archetypeModelKey>) => `/models/${key}.glb`;
// facing: giro del personaje en grados elegido por el usuario (misiones AR).
// zone: zona del Mundo en la que se ambienta la misión AR (isla bajo el personaje).
interface Props { archetype?: number | null; rotate?: boolean; interactive?: boolean; walking?: boolean; celebrating?: boolean; facing?: number; zone?: ZoneKey | null; exposure?: number; onReady?: () => void }

// También lo usan los dioramas del Mundo para colocar al personaje dentro de la zona.
export function ArchetypeCharacter({ archetype, walking, celebrating, facing = 0, reducedMotion, onReady }: Props & { reducedMotion: boolean }) {
  const { scene, animations } = useGLTF(MODEL_URL(archetypeModelKey(archetype)));
  const group = useRef<Group>(null);
  const character = useMemo(() => {
    const copy = clone(scene);
    const box = new Box3().setFromObject(copy);
    const height = box.getSize(new Vector3()).y;
    const center = box.getCenter(new Vector3());
    const scale = 2 / Math.max(height, 0.01);
    copy.scale.multiplyScalar(scale);
    copy.position.set(-center.x * scale, -box.min.y * scale - 1, -center.z * scale);
    return copy;
  }, [scene]);
  const { actions } = useAnimations(animations, group);
  const name = avatarAnimation({ walking, celebrating, reducedMotion });

  useEffect(() => { onReady?.(); }, [onReady]);
  // Gira suavemente hacia la orientación pedida (directo si se prefiere movimiento reducido).
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = MathUtils.degToRad(facing);
    const current = group.current.rotation.y;
    group.current.rotation.y = reducedMotion ? target : current + (target - current) * (1 - Math.exp(-8 * Math.min(delta, 0.05)));
  });
  useEffect(() => {
    const action = actions[name];
    if (!action) return;
    action.reset().setLoop(name === "Cheer" ? LoopOnce : LoopRepeat, Infinity).fadeIn(0.25).play();
    action.clampWhenFinished = true;
    if (reducedMotion) action.paused = true; // pose de reposo estática
    return () => { action.fadeOut(0.25); };
  }, [actions, name, reducedMotion]);

  return <group ref={group}><primitive object={character} /></group>;
}

// Isla de la zona (misiones AR): loseta y adornos del kit del Mundo bajo los pies del personaje,
// que gira junto con él.
// La escena del personaje tiene luz de estudio intensa: la isla usa menos reflejo del entorno
// (materiales clonados para no alterar los dioramas del Mundo, que comparten el kit).
function softenLighting(object: Object3D | null) {
  object?.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    const material = (mesh.material as MeshStandardMaterial).clone();
    material.envMapIntensity = 0.3;
    material.color.multiplyScalar(0.85);
    mesh.material = material;
  });
  return object;
}

function ZonePlatform({ zone, facing = 0, reducedMotion }: { zone: ZoneKey; facing?: number; reducedMotion: boolean }) {
  const { scene } = useGLTF(WORLD_KIT_URL);
  const group = useRef<Group>(null);
  const platform = AR_PLATFORMS[zone];
  const objects = useMemo(
    () => [{ model: platform.ground, x: 0, z: 0, scale: 1, rotation: 0 }, ...platform.props].map((p) => ({ ...p, object: softenLighting(cloneKitPiece(scene, p.model)) })),
    [scene, platform],
  );
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = MathUtils.degToRad(facing);
    const current = group.current.rotation.y;
    group.current.rotation.y = reducedMotion ? target : current + (target - current) * (1 - Math.exp(-8 * Math.min(delta, 0.05)));
  });
  return (
    <group ref={group} position={[0, -1, 0]} scale={1.4}>
      {objects.map((p, i) => p.object && <primitive key={i} object={p.object} position={[p.x, 0, p.z]} scale={i === 0 ? [1, 0.3, 1] : p.scale} rotation={[0, ((p.rotation ?? 0) * Math.PI) / 180, 0]} />)}
    </group>
  );
}

export default function ArchetypeScene(props: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => { setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  const character = <Suspense fallback={null}><ArchetypeCharacter {...props} reducedMotion={reducedMotion} /></Suspense>;
  return (
    // Con isla, la cámara mira un poco desde arriba para que se vea la loseta y sus adornos.
    <Canvas camera={{ position: props.zone ? [0, 1.9, 4.4] : [0, 0.3, 4.7], fov: 34 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} onCreated={({ gl }) => { gl.toneMappingExposure = props.exposure ?? 1.15; }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 4, 2]} scale={[8, 8, 1]} />
        <Lightformer intensity={1} position={[-4, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
      </Environment>
      {props.zone ? (
        // Con isla se reduce y sube un poco para que entren el personaje y la loseta.
        <group scale={0.72} position={[0, 0.25, 0]}>
          {/* Personaje más pequeño que la isla, con los pies sobre la loseta (y = -1) */}
          <group scale={0.75} position={[0, -0.25, 0]}>{character}</group>
          <Suspense fallback={null}><ZonePlatform zone={props.zone} facing={props.facing} reducedMotion={reducedMotion} /></Suspense>
        </group>
      ) : character}
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={props.interactive !== false} autoRotate={props.rotate && !props.walking && !reducedMotion} autoRotateSpeed={1} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  );
}
