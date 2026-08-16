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
 */
export function OnboardingGate() {
  const { user, isLoading } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (typeof window === "undefined") return;
    if (EXEMPT_PATHS.includes(window.location.pathname)) return;

    if (user.archetype === null) {
      navigate({ to: "/create-avatar" });
    }
  }, [isLoading, user.archetype, navigate]);

  return null;
}
