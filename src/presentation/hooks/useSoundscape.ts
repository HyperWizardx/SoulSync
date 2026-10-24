/**
 * Paisajes sonoros generados en el navegador (Web Audio API), sin descargar archivos.
 * Ruido blanco/rosa, lluvia, olas y tonos binaurales. Se detiene al desmontar.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type SoundscapeKind = "off" | "white" | "pink" | "rain" | "waves" | "alpha" | "theta";

export const SOUNDSCAPES: { key: SoundscapeKind; label: string; emoji: string }[] = [
  { key: "off", label: "Silencio", emoji: "🔇" },
  { key: "white", label: "Ruido blanco", emoji: "🌫️" },
  { key: "pink", label: "Ruido rosa", emoji: "🌸" },
  { key: "rain", label: "Lluvia", emoji: "🌧️" },
  { key: "waves", label: "Olas", emoji: "🌊" },
  { key: "alpha", label: "Binaural alfa 10 Hz", emoji: "🎧" },
  { key: "theta", label: "Binaural theta 6 Hz", emoji: "🎧" },
];

const STORAGE_KEY = "soulsync.soundscape";

function noiseBuffer(ctx: AudioContext, pink: boolean) {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (!pink) { d[i] = w * 0.5; continue; }
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
  }
  return buf;
}

export function useSoundscape() {
  const [kind, setKind] = useState<SoundscapeKind>("off");
  const [volume, setVolume] = useState(0.5);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  // Preferencia recordada en el dispositivo (se lee tras hidratar).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved?.volume !== undefined) setVolume(Number(saved.volume));
      if (saved?.kind) setKind(saved.kind === "off" ? "off" : "off"); // no autoreproducir sin gesto
      if (saved?.kind) lastKind.current = saved.kind;
    } catch { /* noop */ }
  }, []);
  const lastKind = useRef<SoundscapeKind>("off");

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const play = useCallback((k: SoundscapeKind) => {
    stop();
    setKind(k);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ kind: k, volume })); } catch { /* noop */ }
    if (k === "off") return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = ctxRef.current ?? new AC();
    ctxRef.current = ctx;
    void ctx.resume();
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    gainRef.current = master;
    const nodes: AudioScheduledSourceNode[] = [];

    if (k === "alpha" || k === "theta") {
      const beat = k === "alpha" ? 10 : 6;
      const base = 200;
      const merger = ctx.createChannelMerger(2);
      [base, base + beat].forEach((f, ch) => {
        const o = ctx.createOscillator();
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.25;
        o.connect(g).connect(merger, 0, ch);
        o.start();
        nodes.push(o);
      });
      merger.connect(master);
    } else {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, k !== "white");
      src.loop = true;
      let out: AudioNode = src;
      if (k === "rain") {
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass"; hp.frequency.value = 900;
        out = out.connect(hp);
      }
      if (k === "waves") {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = 500;
        const swell = ctx.createGain();
        swell.gain.value = 0.5;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.12;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.45;
        lfo.connect(lfoGain).connect(swell.gain);
        lfo.start();
        nodes.push(lfo);
        out = out.connect(lp).connect(swell);
      }
      out.connect(master);
      src.start();
      nodes.push(src);
    }
    stopRef.current = () => {
      nodes.forEach((n) => { try { n.stop(); } catch { /* noop */ } });
      master.disconnect();
    };
  }, [stop, volume]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (gainRef.current) gainRef.current.gain.value = v;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ kind: lastKind.current, volume: v })); } catch { /* noop */ }
  }, []);

  useEffect(() => () => {
    stopRef.current?.();
    void ctxRef.current?.close();
  }, []);

  return { kind, volume, play: (k: SoundscapeKind) => { lastKind.current = k; play(k); }, stop: () => play("off"), setVolume: changeVolume, preferred: lastKind };
}
