// Número que cuenta desde su valor anterior hasta el nuevo (600 ms); con movimiento reducido cambia de golpe.
import { useEffect, useRef, useState } from "react";
import { isMotionReduced } from "@/shared/devicePrefs";

export function AnimatedNumber({ value, from, duration = 600, className }: { value: number; from?: number; duration?: number; className?: string }) {
  const [shown, setShown] = useState(from ?? value);
  const current = useRef(from ?? value);
  useEffect(() => {
    const start = current.current;
    if (start === value || isMotionReduced()) { current.current = value; setShown(value); return; }
    const t0 = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - p) ** 3;
      const next = Math.round(start + (value - start) * eased);
      current.current = next;
      setShown(next);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <span className={className}>{shown}</span>;
}
