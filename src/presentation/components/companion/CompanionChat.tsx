// Conversación guiada con tu héroe (Inicio): el avatar pregunta, el estudiante responde con
// botones y el héroe contesta con lo que saben la brújula, el pronóstico y el recomendador.
// El árbol vive en domain/companion/dialogue (sin IA generativa); aquí solo se muestra y se actúa.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { companionTurn, type CompanionAction, type CompanionContext, type CompanionMood, type CompanionState } from "@/domain/companion/dialogue";
import { useRecommendations } from "@/presentation/hooks/useRecommendations";
import { SupportSheet } from "@/presentation/components/wellbeing/SupportSheet";
import { isMotionReduced } from "@/shared/devicePrefs";

interface Bubble { id: number; from: "heroe" | "yo"; text: string }

const TYPING_MS = 550;

export function CompanionChat({ context, accent, onMood, onClose }: {
  context: Omit<CompanionContext, "recommendation">;
  accent: string;
  onMood: (mood: CompanionMood) => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data: recs } = useRecommendations();
  const ctx: CompanionContext = useMemo(() => {
    const first = recs?.recommendations[0];
    return { ...context, recommendation: first ? { missionId: first.missionId, reason: first.reason } : null };
  }, [context, recs]);

  const [state, setState] = useState<CompanionState>({ node: "inicio" });
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [support, setSupport] = useState(false);
  const nextId = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const turn = useMemo(() => companionTurn(state, ctx), [state, ctx]);

  // Cada turno: el héroe "escribe" sus líneas una a una (sin espera si se reduce el movimiento).
  useEffect(() => {
    onMood(turn.mood);
    const reduced = isMotionReduced();
    const timers: ReturnType<typeof setTimeout>[] = [];
    setTyping(true);
    turn.lines.forEach((text, i) => {
      timers.push(setTimeout(() => {
        setBubbles((b) => [...b, { id: nextId.current++, from: "heroe", text }]);
        if (i === turn.lines.length - 1) setTyping(false);
      }, reduced ? 0 : TYPING_MS * (i + 1)));
    });
    return () => timers.forEach(clearTimeout);
    // Solo al cambiar de turno; recs que llegan tarde no reinician la conversación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest", behavior: isMotionReduced() ? "auto" : "smooth" }); }, [bubbles, typing]);

  const act = (action: CompanionAction) => {
    if (action.kind === "mission") void navigate({ to: "/missions", search: { mission: action.missionId } });
    else if (action.kind === "checkin") void navigate({ to: "/ai" });
    else if (action.kind === "support") setSupport(true);
    else onClose();
  };

  return (
    <div className="mt-3 w-full rounded-2xl border border-border bg-background/60 p-3" aria-label="Conversación con tu héroe">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>Habla con tu {ctx.archetypeName}</p>
        <button onClick={onClose} aria-label="Cerrar conversación" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-1 max-h-72 space-y-2 overflow-y-auto pr-1" aria-live="polite">
        {bubbles.map((b) => (
          <div key={b.id} className={`flex ${b.from === "yo" ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${b.from === "yo" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-card text-foreground"}`}
            >
              {b.text}
            </p>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start" role="status" aria-label="Tu héroe está escribiendo">
            <span className="flex gap-1 rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!typing && (
        <div className="mt-3 flex flex-wrap gap-2">
          {turn.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                if (c.next) {
                  setBubbles((b) => [...b, { id: nextId.current++, from: "yo", text: c.label }]);
                  setState(c.next);
                } else if (c.action) act(c.action);
              }}
              className={`min-h-11 rounded-full border px-3 py-2 text-left text-xs font-semibold transition-transform active:scale-[0.97] ${
                c.action?.kind === "support"
                  ? "border-destructive/40 text-destructive"
                  : c.action?.kind === "mission"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:border-primary"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <SupportSheet open={support} onOpenChange={setSupport} />
    </div>
  );
}
