// Renderiza una copia independiente del personaje medieval del arquetipo y reproduce
// sus animaciones reales (reposo, caminar, celebrar y gestos ocasionales). Modelos: KayKit Adventurers (CC0).
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Box3, Group, LoopOnce, LoopRepeat, MathUtils, Vector3, type AnimationAction, type Mesh, type MeshStandardMaterial, type Object3D } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { archetypeModelKey, avatarAnimation, nextGestureDelay, pickGesture, playsOnce, type AvatarGesture } from "@/domain/identity/avatarMotion";
import { isMotionReduced } from "@/shared/devicePrefs";
import { AR_PLATFORMS, type ZoneKey } from "@/domain/world/dioramas";
import { WORLD_KIT_URL, cloneKitPiece } from "@/presentation/components/world/worldKit";

const MODEL_URL = (key: ReturnType<typeof archetypeModelKey>) => `/models/${key}.glb`;
// facing: giro del personaje en grados elegido por el usuario (misiones AR).
// zone: zona del Mundo en la que se ambienta la misión AR (isla bajo el personaje).
// gestures: en reposo hace de vez en cuando un gesto breve (y uno al tocarlo), como en Inicio.
interface Props { archetype?: number | null; rotate?: boolean; interactive?: boolean; walking?: boolean; celebrating?: boolean; facing?: number; zone?: ZoneKey | null; exposure?: number; gestures?: boolean; onReady?: () => void }

// También lo usan los dioramas del Mundo para colocar al personaje dentro de la zona.
export function ArchetypeCharacter({ archetype, walking, celebrating, facing = 0, gestures = false, reducedMotion, onReady }: Props & { reducedMotion: boolean }) {
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
  const { actions, mixer } = useAnimations(animations, group);
  const [gesture, setGesture] = useState<AvatarGesture | null>(null);
  const [tick, setTick] = useState(0);
  const lastGesture = useRef<AvatarGesture | null>(null);
  const canGesture = gestures && !walking && !celebrating && !reducedMotion;
  const name = avatarAnimation({ walking, celebrating, gesture, reducedMotion });
  const startGesture = () => { const g = pickGesture(Math.random(), lastGesture.current); lastGesture.current = g; setGesture(g); };

  // Gesto ocasional: tras una pausa al azar, si la pestaña está visible; si no, vuelve a esperar.
  useEffect(() => {
    if (!canGesture) { setGesture(null); return; }
    if (gesture) return;
    const t = setTimeout(() => (document.hidden ? setTick((n) => n + 1) : startGesture()), nextGestureDelay(Math.random()));
    return () => clearTimeout(t);
  }, [canGesture, gesture, tick]);
  // Al terminar el gesto vuelve al reposo.
  useEffect(() => {
    const done = (e: { action: AnimationAction }) => { if (gesture && e.action === actions[gesture]) setGesture(null); };
    mixer.addEventListener("finished", done);
    return () => mixer.removeEventListener("finished", done);
  }, [mixer, actions, gesture]);

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
    action.reset().setLoop(playsOnce(name) ? LoopOnce : LoopRepeat, Infinity).fadeIn(0.25).play();
    action.clampWhenFinished = true;
    if (reducedMotion) action.paused = true; // pose de reposo estática
    return () => { action.fadeOut(0.25); };
  }, [actions, name, reducedMotion]);

  // Un toque corto (no un arrastre para girarlo) también lo hace saludar.
  return (
    <group ref={group} onClick={(e) => { if (canGesture && !gesture && e.delta < 6) startGesture(); }}>
      <primitive object={character} />
    </group>
  );
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
  useEffect(() => { setReducedMotion(isMotionReduced()); }, []);
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

// Precarga (para ScenePreloader): baja el modelo antes de que se abra la pantalla que lo usa.
export function preloadArchetype(archetype: number | null) {
  useGLTF.preload(MODEL_URL(archetypeModelKey(archetype)));
}
export function preloadWorldKit() {
  useGLTF.preload(WORLD_KIT_URL);
}
