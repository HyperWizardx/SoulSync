// Hook de las preferencias del dispositivo (movimiento, sonido, vibración) con el valor efectivo
// de "reducir movimiento", que sigue al sistema mientras el usuario no elija.
import { useEffect, useState, useSyncExternalStore } from "react";
import { DEFAULT_PREFS, effectiveReduceMotion, getPrefs, setPrefs, subscribePrefs, systemPrefersReducedMotion } from "@/shared/devicePrefs";

export function useDevicePrefs() {
  const prefs = useSyncExternalStore(subscribePrefs, getPrefs, () => DEFAULT_PREFS);
  const [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemReduced(systemPrefersReducedMotion());
    const onChange = () => setSystemReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return { prefs, setPrefs, reduceMotion: effectiveReduceMotion(prefs, systemReduced), systemReduced };
}
