// Preferencias de este dispositivo: reducir movimiento, sonidos y vibración. Se guardan en
// localStorage porque dependen del equipo (no de la cuenta) y así no requieren cambiar la base de datos.

export interface DevicePrefs {
  reduceMotion: boolean | null; // null = seguir la preferencia del sistema
  sound: boolean;
  haptics: boolean;
}

export const DEFAULT_PREFS: DevicePrefs = { reduceMotion: null, sound: false, haptics: true };
const KEY = "soulsync:device-prefs";

// Lee lo guardado tolerando valores viejos o corruptos.
export function parsePrefs(raw: string | null): DevicePrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const v = JSON.parse(raw) as Partial<DevicePrefs>;
    return {
      reduceMotion: typeof v.reduceMotion === "boolean" ? v.reduceMotion : null,
      sound: typeof v.sound === "boolean" ? v.sound : DEFAULT_PREFS.sound,
      haptics: typeof v.haptics === "boolean" ? v.haptics : DEFAULT_PREFS.haptics,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

// Lo que elige el usuario manda; si no eligió, se sigue al sistema operativo.
export function effectiveReduceMotion(prefs: DevicePrefs, systemReduced: boolean): boolean {
  return prefs.reduceMotion ?? systemReduced;
}

let cache: DevicePrefs | null = null;
const listeners = new Set<() => void>();

export function getPrefs(): DevicePrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  if (!cache) {
    try { cache = parsePrefs(window.localStorage.getItem(KEY)); } catch { cache = DEFAULT_PREFS; }
  }
  return cache;
}

export function setPrefs(patch: Partial<DevicePrefs>) {
  cache = { ...getPrefs(), ...patch };
  try { window.localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* sin almacenamiento: queda en memoria */ }
  listeners.forEach((l) => l());
}

export function subscribePrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function systemPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Para código fuera de React (escenas 3D, sonido): ¿hay que evitar animaciones?
export function isMotionReduced(): boolean {
  return effectiveReduceMotion(getPrefs(), systemPrefersReducedMotion());
}
