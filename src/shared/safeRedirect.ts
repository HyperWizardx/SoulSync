/**
 * Destino seguro después de iniciar sesión: solo rutas internas de la propia app.
 * Rechaza "//otro-sitio", "/\otro-sitio" (el navegador convierte "\" en "/"), esquemas como
 * "javascript:" y caracteres de control, que permitirían mandar al estudiante a una página falsa.
 */
export function safeNext(next?: string | null): string | null {
  if (!next || next.length > 512) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  for (const ch of next) {
    const code = ch.charCodeAt(0);
    if (ch === "\\" || code < 0x20 || code === 0x7f) return null;
  }
  try {
    const base = "https://soulsync.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
