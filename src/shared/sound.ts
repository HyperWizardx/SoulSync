// Efectos de sonido cortos sintetizados con Web Audio (sin archivos que descargar).
// Solo suenan si el usuario activó "Sonidos" en Ajustes.
import { getPrefs } from "@/shared/devicePrefs";

export type SoundName = "tap" | "complete" | "coin" | "levelup";

// Notas de cada efecto: [frecuencia en Hz, inicio en segundos, duración en segundos].
export const SOUNDS: Record<SoundName, [number, number, number][]> = {
  tap: [[660, 0, 0.06]],
  coin: [[988, 0, 0.08], [1319, 0.07, 0.14]],
  complete: [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.22]],
  levelup: [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.12], [1047, 0.3, 0.35]],
};

let context: AudioContext | null = null;

export function playSound(name: SoundName) {
  if (typeof window === "undefined" || !getPrefs().sound) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    context ??= new Ctx();
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    for (const [freq, start, length] of SOUNDS[name]) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      // Envolvente suave: sube en 10 ms y se apaga sin chasquido.
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.12, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      osc.connect(gain).connect(context.destination);
      osc.start(now + start);
      osc.stop(now + start + length + 0.02);
    }
  } catch { /* sin audio disponible: no pasa nada */ }
}
