import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUserStore } from "@/hooks/useUserStore";

// Rutas donde NO debemos forzar la redirección a /create-avatar,
// aunque el usuario todavía no tenga arquetipo.
const EXEMPT_PATHS = ["/create-avatar", "/auth", "/"];

/**
 * Se asegura de que todo usuario autenticado pase por la creación de
 * personaje (avatar + nombre + arquetipo) antes de usar el resto de la app.
 * Antes, ni el login de Google ni el de email/contraseña redirigían a
 * /create-avatar, así que `archetype` se quedaba en null para siempre y el
 * tour de bienvenida (que depende de un arquetipo) nunca se disparaba.
 *
 * IMPORTANTE: se espera explícitamente a `hasSession` además de `!isLoading`.
 * Con `useQuery({ enabled: hasSession })`, mientras la sesión todavía se está
 * confirmando, `isLoading` da `false` (la query ni siquiera ha empezado a
 * correr) mostrando el `user` por defecto (archetype: null) — sin este
 * chequeo, CUALQUIER usuario (nuevo o no) rebotaba un instante a
 * /create-avatar en cada carga, antes de que llegaran sus datos reales.
 */
export function OnboardingGate() {
  const { user, isLoading, hasSession } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasSession || isLoading) return;
    if (typeof window === "undefined") return;
    if (EXEMPT_PATHS.includes(window.location.pathname)) return;

    if (user.archetype === null) {
      navigate({ to: "/create-avatar" });
    }
  }, [hasSession, isLoading, user.archetype, navigate]);

  return null;
}
