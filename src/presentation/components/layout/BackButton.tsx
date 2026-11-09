// Botón "volver" para pantallas secundarias (Tienda, Comunidad) que no tienen pestaña propia:
// regresa a la pantalla anterior o, si se entró directo, a la indicada.
import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackButton({ fallback = "/dashboard" }: { fallback?: "/dashboard" | "/profile" }) {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  return (
    <button
      type="button"
      onClick={() => (canGoBack ? router.history.back() : void navigate({ to: fallback }))}
      aria-label="Volver"
      className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground active:scale-90"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
