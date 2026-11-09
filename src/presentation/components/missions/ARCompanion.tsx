// Compañero relativo a la cámara: arrastre o desplazamiento y retorno suave al acompañamiento.
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Navigation, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniAvatar3D } from "@/presentation/components/layout/MiniAvatar3D";
import { useUserStore } from "@/presentation/hooks/useUserStore";
import { avatarPosition } from "@/domain/identity/avatarMotion";

export function ARCompanion({ scale = 1, walking = false, onTap }: { scale?: number; walking?: boolean; onTap?: () => void }) {
  const { user } = useUserStore();
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [following, setFollowing] = useState(true);
  const [cheering, setCheering] = useState(false);
  const cheerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(cheerTimer.current), []);
  // Al tocar al compañero celebra un momento y luego vuelve a su animación.
  const tap = () => { setCheering(true); clearTimeout(cheerTimer.current); cheerTimer.current = setTimeout(() => setCheering(false), 1800); onTap?.(); };
  const move = (x: number, y: number) => { setFollowing(false); setPosition(avatarPosition(x, y)); };
  const end = (e: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.id !== e.pointerId) return;
    drag.current = null;
    if (!start.moved && e.type !== "pointercancel" && onTap) tap();
  };
  return <div className="relative flex min-h-72 flex-1 flex-col" data-ar-companion data-following={following}>
    <div ref={area} className="relative min-h-56 flex-1 overflow-hidden">
      <div
        role={onTap ? "button" : "group"} aria-label={onTap ? "Cargar energía del avatar" : "Mover avatar AR"} tabIndex={0}
        className="absolute touch-none cursor-grab select-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ left: `${position.x}%`, top: `${position.y}%`, transform: "translate(-50%, -50%)", transition: drag.current ? "none" : "left 450ms ease-out, top 450ms ease-out" }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }; }}
        onPointerMove={(e) => {
          const start = drag.current;
          const bounds = area.current?.getBoundingClientRect();
          if (!start || start.id !== e.pointerId || !bounds) return;
          if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 7 && !start.moved) return;
          start.moved = true;
          move((e.clientX - bounds.left) / bounds.width * 100, (e.clientY - bounds.top) / bounds.height * 100);
        }}
        onPointerUp={end} onPointerCancel={end}
        onKeyDown={(e) => {
          const keys: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
          const delta = keys[e.key];
          if (delta) { e.preventDefault(); move(position.x + delta[0], position.y + delta[1]); }
          if ((e.key === "Enter" || e.key === " ") && onTap) { e.preventDefault(); tap(); }
        }}
      ><div className="pointer-events-none"><MiniAvatar3D size={190} scale={Math.min(scale, 1.3)} archetype={user.archetype} interactive={false} rotate={false} walking={walking && following} celebrating={cheering} /></div></div>
    </div>
    <div className="relative z-20 flex flex-wrap items-center justify-center gap-1 px-3 pb-3">
      {([{ Icon: ArrowLeft, label: "Mover a la izquierda", dx: -8, dy: 0 }, { Icon: ArrowUp, label: "Mover arriba", dx: 0, dy: -8 }, { Icon: ArrowDown, label: "Mover abajo", dx: 0, dy: 8 }, { Icon: ArrowRight, label: "Mover a la derecha", dx: 8, dy: 0 }]).map(({ Icon, label, dx, dy }) => <Button key={label} aria-label={label} title={label} onClick={() => move(position.x + dx, position.y + dy)}><Icon className="h-4 w-4" /></Button>)}
      <Button aria-pressed={following} title="Acompañamiento relativo a la cámara" onClick={() => { setFollowing(true); setPosition({ x: 50, y: 50 }); }}><Navigation className="h-4 w-4" />{following ? "Te acompaña" : "Seguirme"}</Button>
      <Button aria-label="Centrar avatar" title="Centrar avatar" onClick={() => setPosition({ x: 50, y: 50 })}><RotateCcw className="h-4 w-4" /></Button>
    </div>
  </div>;
}