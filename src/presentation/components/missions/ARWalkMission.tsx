import { useEffect, useRef, useState } from "react";
import { X, Footprints } from "lucide-react";
import { ARCompanion } from "@/presentation/components/missions/ARCompanion";
import { Button } from "@/components/ui/button";
import { tap, success } from "@/shared/haptics";

interface Props {
  goal?: number;
  onComplete: () => void;
  onClose: () => void;
}

export function ARWalkMission({ goal = 30, onComplete, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [steps, setSteps] = useState(0);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [motionOk, setMotionOk] = useState<boolean | null>(null);
  const lastPeakRef = useRef(0);
  const completedRef = useRef(false);
  const [walking, setWalking] = useState(false);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cámara
  useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }, audio: false,
        });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraOk(true);
      } catch {
        if (active) setCameraOk(false);
      }
    })();
    return () => { active = false; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  // El permiso de movimiento en iOS se solicita desde el botón, no al montar.
  const enableMotion = async () => {
    if (typeof window.DeviceMotionEvent === "undefined") { setMotionOk(false); return; }
    const DM = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    try { setMotionOk(typeof DM.requestPermission === "function" ? await DM.requestPermission() === "granted" : true); }
    catch { setMotionOk(false); }
  };

  // El avatar camina al recibir un paso, conservando su ubicación relativa a la cámara.
  useEffect(() => {
    if (!steps) return;
    setWalking(true);
    if (walkTimer.current) clearTimeout(walkTimer.current);
    walkTimer.current = setTimeout(() => setWalking(false), 1400);
    return () => { if (walkTimer.current) clearTimeout(walkTimer.current); };
  }, [steps]);

  useEffect(() => {
    if (motionOk !== true) return;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const now = Date.now();
      if (mag > 14 && now - lastPeakRef.current > 350) {
        lastPeakRef.current = now;
        setSteps((s) => Math.min(goal, s + 1));
        tap();
      }
    };

    window.addEventListener("devicemotion", handler);

    return () => window.removeEventListener("devicemotion", handler);
  }, [goal, motionOk]);

  useEffect(() => {
    if (steps >= goal && !completedRef.current) {
      completedRef.current = true;
      success();
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [steps, goal, onComplete]);

  const pct = (steps / goal) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {cameraOk === false ? (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-soul-teal/20" />
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      )}

      <Button
        onClick={onClose}
        aria-label="Cerrar caminata AR"
        className="absolute top-4 right-4 z-30 p-2 backdrop-blur-sm"
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="relative mx-4 mt-4 mr-16 z-10 rounded-lg bg-card/90 backdrop-blur-sm p-3 text-foreground">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Footprints className="h-4 w-4 text-soul-teal" />
          <span>Caminata consciente</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span>{steps} / {goal} pasos</span>
          <span className="text-soul-gold">{Math.round(pct)}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-soul-teal transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        {motionOk === null && <Button className="mt-3 w-full" onClick={enableMotion}><Footprints className="h-4 w-4" />Activar sensor de pasos</Button>}
        {motionOk === false && <p className="mt-2 text-xs text-soul-gold">Sensor no disponible. Registro manual de pasos.</p>}
        {cameraOk === false && <p className="mt-2 text-xs text-muted-foreground">Sin cámara. Caminata sin vista AR.</p>}
      </div>
      <ARCompanion walking={walking} />
      <div className="relative z-10 mx-4 mb-6 rounded-lg bg-card/90 p-3 text-center backdrop-blur-sm">
        <p className="text-sm text-foreground">Caminata consciente</p>
        <p className="mt-1 text-xs text-muted-foreground">Camina en un lugar seguro, lejos del tráfico.</p>
        {motionOk !== true && <Button className="mt-3 w-full" disabled={steps >= goal} onClick={() => { setSteps((s) => Math.min(goal, s + 1)); tap(); }}><Footprints className="h-4 w-4" />Registrar paso manual</Button>}
      </div>
    </div>
  );
}
