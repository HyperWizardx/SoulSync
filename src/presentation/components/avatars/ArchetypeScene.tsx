// Renderiza una copia independiente del personaje y acompaña el movimiento de la misión.
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Group, Vector3 } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import warrior from "@/assets/models/warrior.glb.asset.json";
import healer from "@/assets/models/healer.glb.asset.json";
import explorer from "@/assets/models/explorer.glb.asset.json";
import sage from "@/assets/models/sage.glb.asset.json";
import { archetypeModelKey } from "@/domain/identity/avatarMotion";

const models = { warrior, healer, explorer, sage };
interface Props { archetype?: number | null; rotate?: boolean; interactive?: boolean; walking?: boolean; exposure?: number; onReady?: () => void }

function Character({ archetype, walking, onReady }: Props) {
  const { scene } = useGLTF(models[archetypeModelKey(archetype)].url);
  const group = useRef<Group>(null);
  const ready = useRef(false);
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
  useFrame(({ clock }, delta) => {
    if (!ready.current) { ready.current = true; onReady?.(); }
    if (!group.current) return;
    const t = clock.elapsedTime;
    const target = walking ? Math.sin(t * 9) * 0.06 : 0;
    group.current.position.y += (target - group.current.position.y) * (1 - Math.exp(-10 * Math.min(delta, 0.05)));
    group.current.rotation.z = walking ? Math.sin(t * 4.5) * 0.04 : 0;
  });
  return <group ref={group}><primitive object={character} /></group>;
}

export default function ArchetypeScene(props: Props) {
  const reduced = useRef(false);
  useEffect(() => { reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  return (
    <Canvas camera={{ position: [0, 0.3, 4.7], fov: 34 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} onCreated={({ gl }) => { gl.toneMappingExposure = props.exposure ?? 1.15; }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 4, 2]} scale={[8, 8, 1]} />
        <Lightformer intensity={1} position={[-4, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
      </Environment>
      <Suspense fallback={null}><Character {...props} walking={props.walking && !reduced.current} /></Suspense>
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={props.interactive !== false} autoRotate={props.rotate && !props.walking && !reduced.current} autoRotateSpeed={1} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  );
}