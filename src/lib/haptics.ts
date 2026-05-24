// Vibración táctil sutil en móviles que la soportan.
export function haptic(pattern: number | number[] = 15) {
  if (typeof navigator === "undefined") return;
  if (!navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch { /* noop */ }
}

export const tap = () => haptic(8);
export const success = () => haptic([15, 40, 25]);
export const levelUp = () => haptic([30, 60, 30, 60, 80]);
