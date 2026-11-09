// Orden de las pestañas de la barra inferior, para animar hacia el lado correcto.
export const NAV_ORDER = ["/dashboard", "/world", "/missions", "/ai", "/profile"] as const;

// 1 = la pantalla nueva entra desde la derecha, -1 = desde la izquierda, 0 = no son dos pestañas.
export function navDirection(from: string, to: string): -1 | 0 | 1 {
  const a = NAV_ORDER.indexOf(from as (typeof NAV_ORDER)[number]);
  const b = NAV_ORDER.indexOf(to as (typeof NAV_ORDER)[number]);
  if (a < 0 || b < 0 || a === b) return 0;
  return b > a ? 1 : -1;
}
