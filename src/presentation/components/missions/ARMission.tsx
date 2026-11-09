import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { useEffect, useRef, useState } from "react";
import { X, Camera as CameraIcon } from "lucide-react";
import { ARCompanion } from "@/presentation/components/missions/ARCompanion";
import { ZONE_ACCENT, type ZoneKey } from "@/domain/world/dioramas";
import { zoneInfo } from "@/domain/world/world";
import { withAlpha } from "@/domain/identity/archetype";

interface Props {
  title: string;
  children: (helpers: { stream: MediaStream | null }) => React.ReactNode;
  onClose: () => void;
  zone?: ZoneKey | null; // zona del Mundo en la que se ambienta la misión
}

/** Host: pide cámara, muestra stream a pantalla completa con overlay AR */
export function ARMissionHost({ title, children, onClose, zone = null }: Props) {
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

      {/* Ambientación de la zona: degradado de su color sobre la cámara */}
      {zone && <ZoneTint zone={zone} />}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/70">Misión AR</p>
          <h2 className="font-cinzel text-base font-semibold text-white drop-shadow">{title}</h2>
          {zone && <ZoneChip zone={zone} />}
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

// Personaje 3D del arquetipo sobre la cámara; ver ARCompanion para la interacción.
interface AvatarOverlayProps {
  zone?: ZoneKey | null;
  scale?: number;
  onTap?: () => void;
  tapLabel?: string;
  celebrate?: boolean;
}
export function AvatarOverlay({ scale = 1, onTap, tapLabel, celebrate, zone }: AvatarOverlayProps) {
  return <ARCompanion scale={scale} onTap={onTap} tapLabel={tapLabel} celebrate={celebrate} zone={zone} />;
}

// Etiqueta con la zona del Mundo de la misión.
export function ZoneChip({ zone }: { zone: ZoneKey }) {
  const info = zoneInfo(zone);
  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white backdrop-blur" style={{ backgroundColor: withAlpha(ZONE_ACCENT[zone], 0.55) }}>
      <GameIcon name={info.icon} className="h-3.5 w-3.5" /> {info.name}
    </span>
  );
}

// Degradado del color de la zona en los bordes de la cámara.
export function ZoneTint({ zone }: { zone: ZoneKey }) {
  const accent = ZONE_ACCENT[zone];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ background: `linear-gradient(to bottom, ${withAlpha(accent, 0.35)}, transparent 30%, transparent 60%, ${withAlpha(accent, 0.45)})` }}
    />
  );
}
