import { useEffect, useRef, useState } from "react";
import { X, Camera as CameraIcon } from "lucide-react";
import { MiniAvatar3D } from "@/components/MiniAvatar3D";

interface Props {
  title: string;
  /** Render avatar overlay + UI; receives helpers to finish or cancel */
  children: (helpers: { stream: MediaStream | null }) => React.ReactNode;
  onClose: () => void;
}

/** Host: pide cámara, muestra stream a pantalla completa con overlay AR */
export function ARMissionHost({ title, children, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Cámara no disponible");
      } finally {
        setRequesting(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Video background */}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background text-center px-6">
          <CameraIcon className="h-12 w-12 text-primary animate-pulse" />
          {requesting ? (
            <p className="text-sm text-muted-foreground">Solicitando acceso a la cámara…</p>
          ) : (
            <>
              <p className="text-base font-semibold text-foreground">{error || "Sin cámara disponible"}</p>
              <p className="text-xs text-muted-foreground">
                Activa el permiso de cámara en tu navegador y vuelve a intentarlo.
              </p>
            </>
          )}
        </div>
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/70">Misión AR</p>
          <h2 className="font-cinzel text-base font-semibold text-white drop-shadow">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Overlay content */}
      <div className="relative z-10 flex flex-1 flex-col">{children({ stream })}</div>
    </div>
  );
}

interface AvatarOverlayProps {
  scale?: number;
  glow?: string;
}
export function AvatarOverlay({ scale = 1, glow }: AvatarOverlayProps) {
  return (
    <div className="pointer-events-none flex flex-1 items-center justify-center">
      <div className="animate-float">
        <MiniAvatar3D size={220} rotate scale={scale} glowColor={glow} />
      </div>
    </div>
  );
}
