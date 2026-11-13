import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { AdventureBackdrop } from "@/presentation/components/layout/AdventureBackdrop";
import { WorldDiorama } from "@/presentation/components/world/WorldDiorama";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { OnboardingSteps } from "@/presentation/components/layout/OnboardingSteps";

// Validación manual de la búsqueda: evita cargar zod en el paquete inicial del navegador.
type AuthMode = "login" | "signup" | "reset";
type AuthSearch = { mode: AuthMode; next?: string };
const parseSearch = (s: Record<string, unknown>): AuthSearch => ({
  mode: s.mode === "signup" ? "signup" : s.mode === "reset" ? "reset" : "login",
  next: typeof s.next === "string" ? s.next : undefined,
});

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Accede a tu cuenta | SoulSync" },
    { name: "description", content: "Inicia sesión o crea tu cuenta para guardar tu progreso en SoulSync." },
    { property: "og:title", content: "Accede a tu cuenta | SoulSync" },
    { property: "og:description", content: "Inicia sesión o crea tu cuenta para guardar tu progreso en SoulSync." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: parseSearch,
  component: AuthPage,
});

// Mensajes de error de autenticación traducidos y amables (Supabase responde en inglés).
function friendlyAuthError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  if (msg.includes("invalid login credentials")) return "Correo o contraseña incorrectos. Revísalos e inténtalo de nuevo.";
  if (msg.includes("email not confirmed")) return "Aún no confirmas tu correo. Revisa tu bandeja de entrada.";
  if (msg.includes("already registered") || msg.includes("already been registered")) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (msg.includes("password should be") || msg.includes("at least 6")) return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("same password") || msg.includes("different from the old")) return "Elige una contraseña distinta a la anterior.";
  if (msg.includes("invalid email") || msg.includes("unable to validate email")) return "Ese correo no parece válido.";
  if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("security purposes")) return "Demasiados intentos. Espera un momento y vuelve a intentarlo.";
  if (msg.includes("network") || msg.includes("fetch")) return "No hay conexión. Revisa tu internet e inténtalo de nuevo.";
  return fallback;
}

/** Only same-origin relative paths are accepted as post-login destinations. */
function safeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** Vistas del acceso: formulario, correo de confirmación enviado, recuperar contraseña y nueva contraseña. */
type View = "form" | "confirm" | "forgot" | "forgot-sent" | "reset";

const inputClass = "w-full rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-soul-gold/60 focus:outline-none focus:ring-2 focus:ring-soul-gold/20";
const primaryClass = "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-soul-gold/40 bg-primary text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_var(--color-primary)] transition hover:brightness-110 active:scale-95 disabled:opacity-50";

function PasswordInput({ value, onChange, autoComplete, placeholder, label }: { value: string; onChange: (v: string) => void; autoComplete: string; placeholder: string; label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        aria-label={label}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={6}
        className={`${inputClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { mode, next } = Route.useSearch();
  const [tab, setTab] = useState<"login" | "signup">(mode === "signup" ? "signup" : "login");
  const [view, setView] = useState<View>(mode === "reset" ? "reset" : "form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [recoveryReady, setRecoveryReady] = useState<boolean | null>(null);

  const dest = safeNext(next);
  const goNext = (to: "/dashboard" | "/create-avatar" = "/dashboard") => {
    if (dest) window.location.href = dest;
    else navigate({ to, replace: true });
  };

  // Las pantallas que siguen se descargan mientras el estudiante escribe: el paso es instantáneo.
  useEffect(() => {
    const t = setTimeout(() => {
      void router.preloadRoute({ to: "/create-avatar" }).catch(() => {});
      void router.preloadRoute({ to: "/dashboard" }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [router]);

  // Cuenta regresiva para reenviar correos sin saturar al servidor.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Al llegar desde el enlace de recuperación, Supabase abre una sesión temporal para cambiar la clave.
  useEffect(() => {
    if (view !== "reset") return;
    let alive = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (alive && (event === "PASSWORD_RECOVERY" || session)) setRecoveryReady(true);
    });
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (alive) setRecoveryReady((r) => r ?? Boolean(data.session));
    }, 1200);
    return () => { alive = false; clearTimeout(t); sub.subscription.unsubscribe(); };
  }, [view]);

  const switchTab = (t: "login" | "signup") => { setTab(t); setView("form"); };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${dest ?? "/create-avatar"}`,
            data: { name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          // Sin confirmación por correo: directo a crear el héroe.
          toast.success("¡Tu cuenta de héroe está lista!");
          goNext("/create-avatar");
        } else {
          setView("confirm");
          setCooldown(45);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Qué bueno verte de nuevo!");
        goNext();
      }
    } catch (err) {
      toast.error(friendlyAuthError(err, "No pudimos abrir la puerta. Inténtalo de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}${dest ?? "/create-avatar"}` } });
      if (error) throw error;
      toast.success("Te enviamos el correo otra vez.");
      setCooldown(45);
    } catch (err) {
      toast.error(friendlyAuthError(err, "No pudimos reenviar el correo. Inténtalo en un momento."));
    } finally {
      setLoading(false);
    }
  };

  const sendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?mode=reset` });
      if (error) throw error;
      setView("forgot-sent");
      setCooldown(45);
    } catch (err) {
      toast.error(friendlyAuthError(err, "No pudimos enviar el enlace. Inténtalo de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  const saveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("¡Listo! Tu nueva contraseña ya protege tu aventura.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(friendlyAuthError(err, "No pudimos guardar tu nueva contraseña. Pide un enlace nuevo."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${dest ?? "/dashboard"}`,
      });
      if (result.error) throw result.error;
      if (!result.redirected) {
        toast.success("¡Que comience la aventura!");
        goNext();
      }
    } catch (err) {
      toast.error(friendlyAuthError(err, "No se pudo iniciar sesión con Google. Inténtalo de nuevo."));
      setLoading(false);
    }
  };

  const heading: Record<View, { title: string; sub: string }> = {
    form: tab === "login"
      ? { title: "Entra a tu aventura", sub: "Tu mundo y tus misiones te esperan." }
      : { title: "Forja tu héroe", sub: "Crea tu cuenta y empieza a escribir tu leyenda." },
    confirm: { title: "Revisa tu correo", sub: "Te enviamos un enlace para activar tu cuenta." },
    forgot: { title: "Recupera tu llave", sub: "Te enviamos un enlace para crear una contraseña nueva." },
    "forgot-sent": { title: "Enlace enviado", sub: "Revisa tu correo y sigue el enlace para continuar." },
    reset: { title: "Nueva contraseña", sub: "Elige una contraseña que recuerdes y sigue tu aventura." },
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-6 pb-10 pt-4">
      <AdventureBackdrop />

      <div className="relative z-10 flex w-full max-w-[400px] items-center">
        <button
          onClick={() => (view === "form" || view === "reset" ? navigate({ to: "/" }) : setView("form"))}
          aria-label={view === "form" || view === "reset" ? "Volver a la portada" : "Volver"}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Castillo KayKit del Reino como portada del acceso: estático y ligero */}
      <WorldDiorama zone="reino" icon="castle" progress={100} unlocked season="calma" className="relative z-10 -mt-4 h-[150px] w-full max-w-[320px]" />

      <div className="relative z-10 w-full max-w-[400px] rounded-2xl border border-soul-gold/25 bg-card/85 p-6 shadow-[0_20px_50px_-20px_var(--color-primary)] backdrop-blur animate-fade-in">
        {(tab === "signup" && view === "form") || view === "confirm" ? <OnboardingSteps current="cuenta" className="mb-4" /> : null}
        <div className="mx-auto -mt-1 mb-3 h-[2px] w-16 rounded-full bg-gradient-to-r from-transparent via-soul-gold to-transparent" />
        <h1 className="text-center font-cinzel text-2xl font-bold text-foreground">{heading[view].title}</h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">{heading[view].sub}</p>

        {view === "form" && (
          <>
            <div className="mt-5 flex rounded-xl bg-secondary p-1" role="tablist" aria-label="Tipo de acceso">
              {(["login", "signup"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => switchTab(t)}
                  className={`min-h-9 flex-1 rounded-lg text-xs font-semibold transition-all ${tab === t ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
                >
                  {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </button>
              ))}
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/80 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              Continuar con Google
            </button>

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              o con tu correo
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmail} className="space-y-3">
              {tab === "signup" && (
                <input type="text" aria-label="Nombre de héroe" placeholder="Nombre de héroe" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={20} />
              )}
              <input type="email" aria-label="Correo" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
              <PasswordInput
                value={password}
                onChange={setPassword}
                label="Contraseña"
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                placeholder="Contraseña (mín. 6)"
              />
              {tab === "login" && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setView("forgot")} className="min-h-9 text-xs font-semibold text-primary">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
              <button type="submit" disabled={loading} className={primaryClass}>
                <GameIcon name="crossed-swords" className="h-4 w-4" />
                {loading ? "Abriendo la puerta…" : tab === "login" ? "Entrar" : "Crear mi cuenta"}
              </button>
            </form>
          </>
        )}

        {view === "confirm" && (
          <div className="mt-5 space-y-3 text-center">
            <MailCheck className="mx-auto h-10 w-10 text-soul-gold" aria-hidden />
            <p className="text-sm text-foreground">Abre el correo que enviamos a <span className="font-semibold">{email}</span> y toca el enlace: te traerá directo a crear tu héroe.</p>
            <p className="text-xs text-muted-foreground">Si no lo ves, revisa la carpeta de spam o promociones.</p>
            <button onClick={resendConfirmation} disabled={loading || cooldown > 0} className="min-h-11 w-full rounded-xl border border-border bg-background/80 text-sm font-medium text-foreground disabled:opacity-50">
              {cooldown > 0 ? `Reenviar correo (${cooldown} s)` : "Reenviar correo"}
            </button>
            <button onClick={() => { setTab("login"); setView("form"); }} className={primaryClass}>
              Ya lo confirmé · Entrar
            </button>
          </div>
        )}

        {view === "forgot" && (
          <form onSubmit={sendRecovery} className="mt-5 space-y-3">
            <input type="email" aria-label="Correo" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            <button type="submit" disabled={loading || cooldown > 0} className={primaryClass}>
              <GameIcon name="scroll-quill" className="h-4 w-4" />
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}

        {view === "forgot-sent" && (
          <div className="mt-5 space-y-3 text-center">
            <MailCheck className="mx-auto h-10 w-10 text-soul-gold" aria-hidden />
            <p className="text-sm text-foreground">Si <span className="font-semibold">{email}</span> tiene una cuenta, te llegará un enlace para crear una contraseña nueva.</p>
            <button onClick={() => { setTab("login"); setView("form"); }} className={primaryClass}>Volver a entrar</button>
          </div>
        )}

        {view === "reset" && (
          recoveryReady === false ? (
            <div className="mt-5 space-y-3 text-center">
              <p className="text-sm text-foreground">Este enlace ya venció o se usó. Pide uno nuevo y vuelve en unos minutos.</p>
              <button onClick={() => setView("forgot")} className={primaryClass}>Pedir un enlace nuevo</button>
            </div>
          ) : (
            <form onSubmit={saveNewPassword} className="mt-5 space-y-3">
              <PasswordInput value={password} onChange={setPassword} label="Nueva contraseña" autoComplete="new-password" placeholder="Nueva contraseña (mín. 6)" />
              <button type="submit" disabled={loading || recoveryReady === null} className={primaryClass}>
                <GameIcon name="shield" className="h-4 w-4" />
                {recoveryReady === null ? "Verificando el enlace…" : loading ? "Guardando…" : "Guardar y entrar"}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
