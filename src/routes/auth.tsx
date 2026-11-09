import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ArrowLeft } from "lucide-react";
import { AdventureBackdrop } from "@/presentation/components/layout/AdventureBackdrop";
import { WorldDiorama } from "@/presentation/components/world/WorldDiorama";
import { GameIcon } from "@/presentation/components/icons/GameIcon";

// Validación manual de la búsqueda: evita cargar zod en el paquete inicial del navegador.
type AuthSearch = { mode: "login" | "signup"; next?: string };
const parseSearch = (s: Record<string, unknown>): AuthSearch => ({
  mode: s.mode === "signup" ? "signup" : "login",
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
  if (msg.includes("invalid email") || msg.includes("unable to validate email")) return "Ese correo no parece válido.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "Demasiados intentos. Espera un momento y vuelve a intentarlo.";
  if (msg.includes("network") || msg.includes("fetch")) return "No hay conexión. Revisa tu internet e inténtalo de nuevo.";
  return fallback;
}

/** Only same-origin relative paths are accepted as post-login destinations. */
function safeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

function AuthPage() {
  const navigate = useNavigate();
  const { mode, next } = Route.useSearch();
  const [tab, setTab] = useState<"login" | "signup">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const dest = safeNext(next);
  const goNext = () => {
    if (dest) window.location.href = dest;
    else navigate({ to: "/dashboard" });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${dest ?? "/dashboard"}`,
            data: { name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("¡Tu cuenta de héroe está lista!", { description: "Revisa tu correo para confirmarla y empieza tu aventura." });
        setTab("login");
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


  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-6 pb-10 pt-4">
      <AdventureBackdrop />

      <div className="relative z-10 flex w-full max-w-[400px] items-center">
        <button
          onClick={() => navigate({ to: "/" })}
          aria-label="Volver a la portada"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Castillo KayKit del Reino como portada del acceso: estático y ligero */}
      <WorldDiorama zone="reino" icon="castle" progress={100} unlocked season="calma" className="relative z-10 -mt-4 h-[150px] w-full max-w-[320px]" />

      <div className="relative z-10 w-full max-w-[400px] rounded-2xl border border-soul-gold/25 bg-card/85 p-6 shadow-[0_20px_50px_-20px_var(--color-primary)] backdrop-blur">
        <div className="mx-auto -mt-1 mb-3 h-[2px] w-16 rounded-full bg-gradient-to-r from-transparent via-soul-gold to-transparent" />
        <h1 className="text-center font-cinzel text-2xl font-bold text-foreground">
          {tab === "login" ? "Entra a tu aventura" : "Forja tu héroe"}
        </h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {tab === "login" ? "Tu mundo y tus misiones te esperan." : "Crea tu cuenta y empieza a escribir tu leyenda."}
        </p>

        <div className="mt-5 flex rounded-xl bg-secondary p-1" role="tablist" aria-label="Tipo de acceso">
          <button
            role="tab"
            aria-selected={tab === "login"}
            onClick={() => setTab("login")}
            className={`min-h-9 flex-1 rounded-lg text-xs font-semibold transition-all ${tab === "login" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
          >
            Iniciar sesión
          </button>
          <button
            role="tab"
            aria-selected={tab === "signup"}
            onClick={() => setTab("signup")}
            className={`min-h-9 flex-1 rounded-lg text-xs font-semibold transition-all ${tab === "signup" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
          >
            Crear cuenta
          </button>
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
            <input
              type="text"
              aria-label="Nombre de héroe"
              placeholder="Nombre de héroe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-soul-gold/60 focus:outline-none focus:ring-2 focus:ring-soul-gold/20"
              maxLength={40}
            />
          )}
          <input
            type="email"
            aria-label="Correo"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-soul-gold/60 focus:outline-none focus:ring-2 focus:ring-soul-gold/20"
          />
          <input
            type="password"
            aria-label="Contraseña"
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            placeholder="Contraseña (mín. 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-soul-gold/60 focus:outline-none focus:ring-2 focus:ring-soul-gold/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-soul-gold/40 bg-primary text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_var(--color-primary)] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            <GameIcon name="crossed-swords" className="h-4 w-4" />
            {loading ? "Abriendo la puerta…" : tab === "login" ? "Entrar" : "Crear mi cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
