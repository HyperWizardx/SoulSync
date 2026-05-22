import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StarField } from "@/components/StarField";
import { Shield, Brain, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: SplashPage,
});

function SplashPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) navigate({ to: "/dashboard" });
      else setChecking(false);
    });
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <StarField />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 h-[200px] w-[200px] rounded-full bg-soul-teal/10 blur-[80px]" />
      </div>

      <div className="relative mb-8">
        <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary via-primary/60 to-soul-teal animate-orb-spin" />
        <div className="absolute inset-0 rounded-full animate-orb-glow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-cinzel font-bold text-primary-foreground drop-shadow-lg">SS</span>
        </div>
      </div>

      <h1 className="relative z-10 text-4xl font-cinzel font-bold tracking-wider text-foreground">
        SoulSync
      </h1>
      <p className="relative z-10 mt-2 text-center text-sm text-muted-foreground">
        Tu aventura de bienestar emocional
      </p>

      {!checking && (
        <>
          <button
            onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
            className="relative z-10 mt-10 w-full max-w-[280px] rounded-xl bg-primary px-6 py-3.5 text-center font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-95"
          >
            ⚔️ Comenzar Aventura
          </button>
          <button
            onClick={() => navigate({ to: "/auth", search: { mode: "login" } })}
            className="relative z-10 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ya tengo cuenta
          </button>
        </>
      )}

      <div className="relative z-10 mt-12 flex gap-6 text-muted-foreground">
        <div className="flex flex-col items-center gap-1">
          <Shield className="h-5 w-5 text-soul-teal" />
          <span className="text-[10px]">Seguro</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Brain className="h-5 w-5 text-primary" />
          <span className="text-[10px]">IA Ética</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Heart className="h-5 w-5 text-soul-gold" />
          <span className="text-[10px]">Evidencia</span>
        </div>
      </div>
    </div>
  );
}
