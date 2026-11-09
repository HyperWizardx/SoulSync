// Renderiza una copia independiente del personaje medieval del arquetipo y reproduce
// sus animaciones reales (reposo, caminar, celebrar). Modelos: KayKit Adventurers (CC0).
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Box3, Group, LoopOnce, LoopRepeat, Vector3 } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { archetypeModelKey, avatarAnimation } from "@/domain/identity/avatarMotion";

const MODEL_URL = (key: ReturnType<typeof archetypeModelKey>) => `/models/${key}.glb`;
interface Props { archetype?: number | null; rotate?: boolean; interactive?: boolean; walking?: boolean; celebrating?: boolean; exposure?: number; onReady?: () => void }

function Character({ archetype, walking, celebrating, reducedMotion, onReady }: Props & { reducedMotion: boolean }) {
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

export default function ArchetypeScene(props: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => { setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  return (
    <Canvas camera={{ position: [0, 0.3, 4.7], fov: 34 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} onCreated={({ gl }) => { gl.toneMappingExposure = props.exposure ?? 1.15; }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 4, 2]} scale={[8, 8, 1]} />
        <Lightformer intensity={1} position={[-4, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
      </Environment>
      <Suspense fallback={null}><Character {...props} reducedMotion={reducedMotion} /></Suspense>
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={props.interactive !== false} autoRotate={props.rotate && !props.walking && !reducedMotion} autoRotateSpeed={1} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  );
}
