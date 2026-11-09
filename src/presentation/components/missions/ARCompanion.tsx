// Compañero 3D relativo a la cámara en las misiones AR. El usuario puede tocarlo (reacciona),
// arrastrarlo, girarlo y cambiar su tamaño con botones, teclado o gestos de dos dedos.
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { LocateFixed, Navigation, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniAvatar3D } from "@/presentation/components/layout/MiniAvatar3D";
import { useUserStore } from "@/presentation/hooks/useUserStore";
import { getArchetypeStyle } from "@/domain/identity/archetype";
import { AVATAR_ZOOM, avatarPosition, avatarZoom } from "@/domain/identity/avatarMotion";

interface Props {
  scale?: number;          // tamaño que impone la misión (respiración, carga de energía…)
  walking?: boolean;       // la misión indica que el personaje camina
  celebrate?: boolean;     // la misión terminó: el personaje celebra
  onTap?: () => void;      // acción propia de la misión al tocar al personaje
  tapLabel?: string;
}

type Point = { x: number; y: number };
const ROTATE_STEP = 45;
const ZOOM_STEP = 0.15;
const ICON = "w-10 px-0"; // botones de icono compactos para que quepan en una fila en móvil
const clampZoom = (z: number) => Math.max(AVATAR_ZOOM.min, Math.min(AVATAR_ZOOM.max, z));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const angle = (a: Point, b: Point) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

export function ARCompanion({ scale = 1, walking = false, celebrate = false, onTap, tapLabel }: Props) {
  const { user } = useUserStore();
  const style = getArchetypeStyle(user.archetype);
  const who = user.archetype === null ? "personaje" : style.name.toLowerCase();
  const area = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<{ id: number; start: Point; moved: boolean } | null>(null);
  const pinch = useRef<{ dist: number; angle: number; zoom: number; facing: number } | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [following, setFollowing] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [facing, setFacing] = useState(0);
  const [cheering, setCheering] = useState(false);
  const [hint, setHint] = useState(true);
  const cheerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(cheerTimer.current), []);

  const interacted = () => setHint(false);
  // Al tocarlo celebra un momento, ejecuta la acción de la misión y vuelve a su animación.
  const tap = () => {
    interacted();
    setCheering(true);
    clearTimeout(cheerTimer.current);
    cheerTimer.current = setTimeout(() => setCheering(false), 1800);
    onTap?.();
  };
  const move = (x: number, y: number) => { interacted(); setFollowing(false); setPosition(avatarPosition(x, y)); };
  const turn = (deg: number) => { interacted(); setFacing((f) => f + deg); };
  const resize = (delta: number) => { interacted(); setZoom((z) => clampZoom(z + delta)); };
  const reset = () => { setPosition({ x: 50, y: 50 }); setZoom(1); setFacing(0); };

  const startPinch = () => {
    const [a, b] = [...pointers.current.values()];
    pinch.current = { dist: distance(a, b), angle: angle(a, b), zoom, facing };
    drag.current = null; // un gesto de dos dedos no es arrastre ni toque
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1 && avatarRef.current?.contains(e.target as Node)) {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { id: e.pointerId, start: { x: e.clientX, y: e.clientY }, moved: false };
    } else if (pointers.current.size === 2) {
      e.currentTarget.setPointerCapture(e.pointerId);
      startPinch();
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const gesture = pinch.current;
    if (gesture && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      interacted();
      setZoom(clampZoom(gesture.zoom * (distance(a, b) / Math.max(gesture.dist, 1))));
      setFacing(gesture.facing + (angle(a, b) - gesture.angle));
      return;
    }
    const start = drag.current;
    const bounds = area.current?.getBoundingClientRect();
    if (!start || start.id !== e.pointerId || !bounds) return;
    if (!start.moved && distance(start.start, { x: e.clientX, y: e.clientY }) < 7) return;
    start.moved = true;
    move(((e.clientX - bounds.left) / bounds.width) * 100, ((e.clientY - bounds.top) / bounds.height) * 100);
  };
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pinch.current) {
      if (pointers.current.size < 2) pinch.current = null;
      return;
    }
    const start = drag.current;
    if (!start || start.id !== e.pointerId) return;
    drag.current = null;
    if (!start.moved && e.type !== "pointercancel") tap();
  };

  const effectiveScale = avatarZoom(zoom, scale);
  return (
    <div className="relative flex min-h-72 flex-1 flex-col" data-ar-companion data-following={following}>
      <div
        ref={area}
        className="relative min-h-56 flex-1 touch-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div
          ref={avatarRef}
          role="button"
          tabIndex={0}
          aria-label={`${tapLabel ?? `Tocar a tu ${who}`}. Flechas para mover, Q y E para girar, más y menos para el tamaño.`}
          className="absolute cursor-grab select-none rounded-full active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ left: `${position.x}%`, top: `${position.y}%`, transform: "translate(-50%, -50%)", transition: drag.current ? "none" : "left 450ms ease-out, top 450ms ease-out" }}
          onKeyDown={(e) => {
            const keys: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
            const delta = keys[e.key];
            if (delta) { e.preventDefault(); move(position.x + delta[0], position.y + delta[1]); }
            else if (e.key === "q" || e.key === "Q") turn(-ROTATE_STEP);
            else if (e.key === "e" || e.key === "E") turn(ROTATE_STEP);
            else if (e.key === "+" || e.key === "=") resize(ZOOM_STEP);
            else if (e.key === "-") resize(-ZOOM_STEP);
            else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); }
          }}
        >
          <div className="pointer-events-none">
            <MiniAvatar3D
              size={190}
              scale={effectiveScale}
              archetype={user.archetype}
              interactive={false}
              rotate={false}
              walking={walking && following}
              celebrating={cheering || celebrate}
              facing={facing}
              glowColor={style.glow}
              exposure={style.exposure}
            />
          </div>
        </div>
        {hint && (
          <p className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-black/55 px-3 py-1 text-[11px] text-white backdrop-blur">
            Toca, arrastra o usa dos dedos para girar y acercar a tu {who}
          </p>
        )}
      </div>
      <div className="relative z-20 flex flex-wrap items-center justify-center gap-1 px-3 pb-3" role="toolbar" aria-label="Controles del personaje">
        <Button className={ICON} aria-label="Girar a la izquierda" title="Girar a la izquierda" onClick={() => turn(-ROTATE_STEP)}><RotateCcw className="h-4 w-4" /></Button>
        <Button className={ICON} aria-label="Girar a la derecha" title="Girar a la derecha" onClick={() => turn(ROTATE_STEP)}><RotateCw className="h-4 w-4" /></Button>
        <Button className={ICON} aria-label="Alejar" title="Alejar" disabled={zoom <= AVATAR_ZOOM.min} onClick={() => resize(-ZOOM_STEP)}><ZoomOut className="h-4 w-4" /></Button>
        <Button className={ICON} aria-label="Acercar" title="Acercar" disabled={zoom >= AVATAR_ZOOM.max} onClick={() => resize(ZOOM_STEP)}><ZoomIn className="h-4 w-4" /></Button>
        <Button className="px-2.5" aria-pressed={following} title="Acompañamiento relativo a la cámara" onClick={() => { setFollowing(true); setPosition({ x: 50, y: 50 }); }}>
          <Navigation className="h-4 w-4" />{following ? "Te acompaña" : "Seguirme"}
        </Button>
        <Button className={ICON} aria-label="Restablecer posición, giro y tamaño" title="Restablecer" onClick={reset}><LocateFixed className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
