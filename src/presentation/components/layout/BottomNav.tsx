// Barra inferior: un indicador se desliza desde la pestaña anterior hasta la activa, el ícono
// activo rebota una vez y cada toque vibra levemente (si la vibración está activada).
import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { m } from "motion/react";
import { Home, Globe, Swords, Brain, User } from "lucide-react";
import { tap } from "@/shared/haptics";

const navItems = [
  { to: "/dashboard" as const, icon: Home, label: "Inicio" },
  { to: "/world" as const, icon: Globe, label: "Mundo" },
  { to: "/missions" as const, icon: Swords, label: "Misiones" },
  { to: "/ai" as const, icon: Brain, label: "Bienestar" },
  { to: "/profile" as const, icon: User, label: "Perfil" },
];

// Pantallas secundarias sin pestaña propia: se marca la pestaña desde la que se llega a ellas.
const PARENT_TAB: Record<string, string> = { "/store": "/profile", "/community": "/profile" };

// Cada pantalla monta su propia barra: la pestaña anterior se recuerda a nivel de módulo.
let lastIndex = -1;

export function BottomNav() {
  const rawPath = useRouterState({ select: (s) => s.location.pathname });
  const pathname = PARENT_TAB[rawPath] ?? rawPath;
  const index = navItems.findIndex((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  const from = lastIndex >= 0 ? lastIndex : index;
  useEffect(() => { if (index >= 0) lastIndex = index; }, [index]);
  const slot = 100 / navItems.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg" aria-label="Navegación principal">
      <div className="relative mx-auto flex max-w-[430px] items-center justify-around py-2">
        {index >= 0 && (
          <m.span
            aria-hidden
            className="absolute top-0 h-0.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
            style={{ width: `${slot * 0.5}%` }}
            initial={{ left: `${from * slot + slot * 0.25}%` }}
            animate={{ left: `${index * slot + slot * 0.25}%` }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          />
        )}
        {navItems.map((item, i) => {
          const active = i === index;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              onClick={() => tap()}
              className={`flex min-h-11 min-w-11 flex-1 flex-col items-center gap-0.5 px-1 py-1 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <m.span
                className="flex"
                initial={active && from !== index ? { scale: 0.8, y: 2 } : false}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 14 }}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </m.span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
