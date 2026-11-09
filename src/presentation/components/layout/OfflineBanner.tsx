// Aviso discreto cuando el dispositivo pierde la conexión; desaparece solo al reconectar.
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] mx-auto flex max-w-[430px] items-center justify-center gap-2 bg-soul-gold px-3 py-1.5 text-xs font-semibold text-background">
      <WifiOff className="h-3.5 w-3.5" aria-hidden /> Sin conexión: tus cambios se guardarán cuando vuelva la red
    </div>
  );
}
