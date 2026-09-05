import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdmin";
import { useAuthSession } from "@/components/AuthSessionProvider";

/**
 * Contenedor del panel de administración. La verificación real de permisos
 * ocurre en el servidor en cada petición; esto solo evita mostrar una
 * pantalla vacía a quien no tiene rol.
 */
export function AdminShell({
  title,
  subtitle,
  requires,
  children,
  back,
}: {
  title: string;
  subtitle?: string;
  requires: "psicologo" | "investigador";
  children: ReactNode;
  back?: { to: "/admin"; label: string };
}) {
  const navigate = useNavigate();
  const { hasSession, isCheckingSession } = useAuthSession();
  const { data: access, isLoading } = useAdminAccess();

  useEffect(() => {
    if (isCheckingSession) return;
    if (!hasSession) navigate({ to: "/auth", search: { mode: "login" } });
  }, [hasSession, isCheckingSession, navigate]);

  const allowed = access?.[requires] ?? false;

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-background px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-cinzel text-xl font-bold text-foreground">{title}</h1>
            {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        <nav className="flex items-center gap-2 text-xs">
          {back ? (
            <Link to={back.to} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> {back.label}
            </Link>
          ) : null}
          {access?.psicologo ? (
            <Link to="/admin" className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground">
              Estudiantes
            </Link>
          ) : null}
          {access?.investigador ? (
            <Link to="/admin/metricas" className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground">
              Métricas
            </Link>
          ) : null}
          <Link to="/dashboard" className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground">
            Salir del panel
          </Link>
        </nav>
      </header>

      {isLoading || isCheckingSession ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !allowed ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-semibold text-foreground">Acceso restringido</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta sección es solo para el equipo autorizado ({requires === "psicologo" ? "psicología" : "investigación"}).
          </p>
          <Link to="/dashboard" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
            Volver a mi cuenta
          </Link>
        </div>
      ) : (
        <>
          {children}
          <p className="mt-10 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            Señal preventiva exploratoria: no constituye diagnóstico clínico ni sustituye la valoración de un
            profesional de salud mental. Datos tratados bajo consentimiento informado.
          </p>
        </>
      )}
    </div>
  );
}
