import { createFileRoute, Link } from "@tanstack/react-router";
import { StarField } from "@/components/StarField";
import { AlertTriangle, Phone, MessageCircle, X } from "lucide-react";

export const Route = createFileRoute("/alert")({
  component: AlertPage,
});

function AlertPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <StarField />

      {/* Dimmed background */}
      <div className="flex-1" />

      {/* Bottom Sheet */}
      <div className="relative z-10 rounded-t-3xl border-t border-destructive/30 bg-card px-6 pb-8 pt-6 shadow-2xl animate-fade-in">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />

        {/* Close */}
        <Link to="/dashboard" className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary">
          <X className="h-5 w-5" />
        </Link>

        {/* Alert Icon */}
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mt-4 text-xl font-cinzel font-bold text-foreground">Alerta de IA</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Hemos detectado un patrón de estrés elevado durante las últimas 3 horas. Tu bienestar nos importa.
          </p>
        </div>

        {/* Metrics */}
        <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nivel de estrés</span>
            <span className="font-bold text-destructive">Alto (+15%)</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-destructive" style={{ width: "78%" }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ritmo cardíaco</span>
            <span className="font-bold text-soul-gold">92 bpm</span>
          </div>
        </div>

        {/* Suggested Action */}
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">💡 Misión sugerida</p>
          <p className="mt-1 text-xs text-muted-foreground">Respiración 4-7-8: Inhala 4s, sostén 7s, exhala 8s. Repite 3 veces.</p>
          <button className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
            Iniciar misión de calma 🧘
          </button>
        </div>

        {/* Emergency Options */}
        <div className="mt-4 flex gap-3">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm text-foreground hover:bg-secondary">
            <Phone className="h-4 w-4" /> Llamar
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm text-foreground hover:bg-secondary">
            <MessageCircle className="h-4 w-4" /> Chat
          </button>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Línea de crisis 24/7: 024
        </p>
      </div>
    </div>
  );
}
