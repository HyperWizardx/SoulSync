// Transición al cambiar de pantalla: fundido corto con desplazamiento hacia el lado de la
// pestaña de destino (según el orden de la barra inferior) o hacia arriba si no es una pestaña.
import { useEffect, type ReactNode } from "react";
import { m } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { navDirection } from "@/presentation/components/motion/navOrder";

// Cada pantalla monta su propio layout, así que la ruta anterior se recuerda a nivel de módulo.
let lastPath: string | null = null;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const direction = lastPath ? navDirection(lastPath, pathname) : 0;
  useEffect(() => { lastPath = pathname; }, [pathname]);
  return (
    <m.div
      key={pathname}
      initial={{ opacity: 0, x: direction * 16, y: direction === 0 ? 8 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </m.div>
  );
}
