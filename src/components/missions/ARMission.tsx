import { useEffect, useRef, useState } from "react";
import { X, Camera as CameraIcon } from "lucide-react";
import { MiniAvatar3D } from "@/components/MiniAvatar3D";
import { useUserStore } from "@/hooks/useUserStore";
import { getArchetypeStyle } from "@/lib/archetype";

interface Props {
  title: string;
  children: (helpers: { stream: MediaStream | null }) => React.ReactNode;
  onClose: () => void;
}

/** Host: pide cámara, muestra stream a pantalla completa con overlay AR */
export function ARMissionHost({ title, children, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(true);

  // 1) Pedir cámara una sola vez
  useEffect(() => {
    let active = true;
    let acquired: MediaStream | null = null;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no soporta cámara (necesitas HTTPS y un navegador moderno).");
      setRequesting(false);
      return;
    }

    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        acquired = s;
        setStream(s);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Cámara no disponible";
        // Mensajes más útiles
        let friendly = msg;
        if (/Permission|NotAllowed/i.test(msg)) friendly = "Permiso de cámara denegado. Activa el permiso en tu navegador.";
        else if (/NotFound|Devices/i.test(msg)) friendly = "No se encontró ninguna cámara en este dispositivo.";
        else if (/Secure|https/i.test(msg)) friendly = "La cámara requiere HTTPS. Abre la app en su URL publicada.";
        setError(friendly);
      } finally {
        if (active) setRequesting(false);
      }
    })();

    return () => {
      active = false;
      acquired?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // 2) Cuando ya tenemos stream Y el <video> está montado, conectamos srcObject.
  //    Esto evita la race condition: el <video> sólo se renderiza si stream existe,
  //    así que el ref no estaba listo dentro del async getUserMedia.
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
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
              <p className="text-xs text-muted-foreground max-w-xs">
                Si estás en la vista previa de Lovable, abre la URL publicada en tu móvil para conceder permiso de cámara.
              </p>
              <button
                onClick={onClose}
                className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Volver
              </button>
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

      <div className="relative z-10 flex flex-1 flex-col">{children({ stream })}</div>
    </div>
  );
}

interface AvatarOverlayProps {
  scale?: number;
  /** Si no se pasa, se deriva del arquetipo del usuario */
  glow?: string;
}
export function AvatarOverlay({ scale = 1, glow }: AvatarOverlayProps) {
  const { user } = useUserStore();
  const style = getArchetypeStyle(user.archetype);
  return (
    <div className="pointer-events-none flex flex-1 items-center justify-center">
      <div className="animate-float">
        <MiniAvatar3D
          size={220}
          rotate
          scale={scale}
          glowColor={glow ?? style.glow}
          exposure={style.exposure}
        />
      </div>
    </div>
  );
}
