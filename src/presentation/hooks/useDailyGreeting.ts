// El personaje de Inicio saluda (animación Cheer) la primera vez que se abre la app cada día.
import { useEffect, useState } from "react";

const KEY = "soulsync:last-greeting";

export function useDailyGreeting(durationMs = 2200): boolean {
  const [greeting, setGreeting] = useState(false);
  useEffect(() => {
    const today = new Date().toDateString();
    let last: string | null = null;
    try { last = window.localStorage.getItem(KEY); } catch { /* sin almacenamiento */ }
    if (last === today) return;
    try { window.localStorage.setItem(KEY, today); } catch { /* sin almacenamiento */ }
    setGreeting(true);
    const t = setTimeout(() => setGreeting(false), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);
  return greeting;
}
