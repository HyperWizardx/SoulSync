import { useEffect, useRef, useState } from "react";
import { X, Footprints } from "lucide-react";
import { MiniAvatar3D } from "@/components/MiniAvatar3D";
import { tap, success } from "@/lib/haptics";
import { useUserStore } from "@/hooks/useUserStore";
import { getArchetypeStyle } from "@/lib/archetype";

interface Props {
  goal?: number;
  onComplete: () => void;
  onClose: () => void;
}

export function ARWalkMission({ goal = 30, onComplete, onClose }: Props) {
  const { user } = useUserStore();
  const archStyle = getArchetypeStyle(user.archetype);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [steps, setSteps] = useState(0);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [motionOk, setMotionOk] = useState<boolean | null>(null);
  const lastPeakRef = useRef(0);
  const completedRef = useRef(false);

  // Cámara
  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }, audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraOk(true);
      } catch {
        setCameraOk(false);
      }
    })();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  // Detector de pasos vía DeviceMotion (umbral en aceleración)
  useEffect(() => {
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

    const attach = () => {
      window.addEventListener("devicemotion", handler);
      setMotionOk(true);
    };

    const DM = (DeviceMotionEvent as unknown) as { requestPermission?: () => Promise<string> };
    if (typeof DM.requestPermission === "function") {
      DM.requestPermission()
        .then((res) => { if (res === "granted") attach(); else setMotionOk(false); })
        .catch(() => setMotionOk(false));
    } else if (typeof window.DeviceMotionEvent !== "undefined") {
      attach();
    } else {
      setMotionOk(false);
    }

    return () => window.removeEventListener("devicemotion", handler);
  }, [goal]);

  useEffect(() => {
    if (steps >= goal && !completedRef.current) {
      completedRef.current = true;
      success();
      setTimeout(onComplete, 800);
    }
  }, [steps, goal, onComplete]);

  const pct = (steps / goal) * 100;
  const avatarSize = 80 + (steps / goal) * 120;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {cameraOk === false ? (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-soul-teal/20" />
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      )}

      <button
        onClick={onClose}
        aria-label="Cerrar caminata AR"
        className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm active:scale-90 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="absolute top-4 left-4 right-16 z-10 rounded-xl bg-black/60 backdrop-blur-sm p-3 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Footprints className="h-4 w-4 text-soul-teal" />
          <span>Caminata consciente</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span>{steps} / {goal} pasos</span>
          <span className="text-soul-gold">{Math.round(pct)}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-soul-teal transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        {motionOk === false && (
          <p className="mt-2 text-[10px] text-soul-gold">
            Tu dispositivo no detecta movimiento. Toca la pantalla para sumar pasos manualmente.
          </p>
        )}
      </div>

      <div
        className="absolute left-1/2 bottom-32 z-10 -translate-x-1/2 transition-all duration-500"
        onClick={() => { if (motionOk === false) { setSteps((s) => Math.min(goal, s + 1)); tap(); } }}
      >
        <MiniAvatar3D size={avatarSize} glowColor={archStyle.glow} exposure={archStyle.exposure} />
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-10 text-center">
        <p className="text-xs text-white/80 px-6">
          Camina con consciencia. Tu avatar crece con cada paso 🌱
        </p>
      </div>
    </div>
  );
}
