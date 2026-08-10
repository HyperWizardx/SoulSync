import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { StarField } from "@/components/StarField";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional().default("login"),
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

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
        toast.success("Cuenta creada", { description: "Revisa tu correo para verificar tu email." });
        setTab("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido de vuelta!");
        goNext();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de autenticación");
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
        toast.success("¡Bienvenido!");
        goNext();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google");
      setLoading(false);
    }
  };


  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-10">
      <StarField />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] rounded-2xl border border-border bg-card/80 backdrop-blur p-6 shadow-xl">
        <h1 className="text-center text-2xl font-cinzel font-bold text-foreground">SoulSync</h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {tab === "login" ? "Inicia sesión para continuar tu aventura" : "Crea tu cuenta de héroe"}
        </p>

        <div className="mt-5 flex rounded-xl bg-secondary p-1">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${tab === "login" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${tab === "signup" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
          >
            Crear cuenta
          </button>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continuar con Google
        </button>

        <div className="my-4 flex items-center gap-3 text-[10px] text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          O CON EMAIL
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {tab === "signup" && (
            <input
              type="text"
              placeholder="Nombre de héroe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              maxLength={40}
            />
          )}
          <input
            type="email"
            placeholder="email@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 active:scale-95 transition disabled:opacity-50"
          >
            {loading ? "Procesando..." : tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          ← Volver
        </button>
      </div>
    </div>
  );
}
