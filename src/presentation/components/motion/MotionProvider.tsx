// Proveedor global de animaciones: carga solo las funciones de motion que usamos (LazyMotion)
// y las desactiva cuando el usuario o el sistema piden reducir movimiento. También marca
// <html data-reduce-motion> para que las animaciones CSS se detengan.
import { useEffect, type ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";
import { useDevicePrefs } from "@/presentation/hooks/useDevicePrefs";

const loadFeatures = () => import("./motionFeatures").then((m) => m.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  const { reduceMotion } = useDevicePrefs();
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-reduce-motion", reduceMotion ? "true" : "false");
  }, [reduceMotion]);
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={reduceMotion ? "always" : "never"} transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
