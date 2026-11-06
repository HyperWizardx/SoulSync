// Estados reutilizables de carga, error y reintento para consultas remotas.
// Evita pantallas que quedan cargando indefinidamente: tras un tiempo ofrece reintentar.
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/** Rechaza la promesa si no responde en `ms`, para que la consulta pase a estado de error. */
export function withTimeout<T>(promise: Promise<T>, ms = 20_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("La solicitud tardó demasiado")), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

export function LoadingState({ onRetry, slowAfterMs = 10_000, children }: { onRetry?: () => void; slowAfterMs?: number; children?: ReactNode }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), slowAfterMs);
    return () => clearTimeout(t);
  }, [slowAfterMs]);
  return (
    <div aria-busy="true" role="status" className="space-y-3">
      {children ?? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {slow && (
        <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <p>Esto está tardando más de lo normal.</p>
          {onRetry && (
            <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-foreground hover:border-primary">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reintentar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry, retrying }: { message?: string; onRetry: () => void; retrying?: boolean }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-card p-6 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-semibold text-foreground">No pudimos cargar la información</p>
        <p className="mt-1 text-sm text-muted-foreground">{message ?? "Revisa tu conexión e inténtalo de nuevo."}</p>
      </div>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" /> Reintentar
      </button>
    </div>
  );
}
