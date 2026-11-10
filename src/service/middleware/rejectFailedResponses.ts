/**
 * Middleware de cliente de las server functions — capa de Servicio.
 * Si el servidor responde con un error "crudo" (p. ej. 401 por sesión vencida), TanStack entrega
 * el objeto Response como si fuera el resultado y las pantallas se rompían al leer datos que no
 * existen. Aquí se convierte en un error para que cada pantalla muestre su estado de error y, si
 * la sesión ya no es válida, se intenta renovarla; si no se puede, se cierra para volver a entrar.
 */
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Vuelve a entrar para continuar tu aventura.";

let renewing = false;

/** Renueva la sesión una sola vez a la vez; si no se puede, cierra sesión (la app lleva al inicio). */
async function renewOrSignOut() {
  if (renewing) return;
  renewing = true;
  try {
    const { data } = await supabase.auth.refreshSession();
    if (!data.session) await supabase.auth.signOut();
  } catch {
    /* sin conexión: se intentará en la próxima solicitud */
  } finally {
    setTimeout(() => { renewing = false; }, 5_000);
  }
}

export const rejectFailedResponses = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const ctx = await next();
  const result = (ctx as { result?: unknown }).result;
  if (typeof Response !== "undefined" && result instanceof Response && !result.ok) {
    if (result.status === 401) {
      void renewOrSignOut();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
    throw new Error("No pudimos conectar con tu aventura. Intenta de nuevo en un momento.");
  }
  return ctx;
});
