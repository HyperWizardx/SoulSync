// Entrada escalonada para tarjetas de listas: cada una aparece 40 ms después de la anterior
// (como máximo 8 pasos, para que una lista larga no tarde en mostrarse).
import type { ReactNode } from "react";
import { m } from "motion/react";

function revealDelay(index: number) {
  return Math.min(index, 8) * 0.04;
}

export function Reveal({ index = 0, children, className }: { index?: number; children: ReactNode; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: revealDelay(index), ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </m.div>
  );
}
