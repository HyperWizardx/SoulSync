import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StarField } from "@/components/StarField";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";
import { AvatarIcon, AVATAR_META } from "@/components/avatars/AvatarArt";
import { toast } from "sonner";

export const Route = createFileRoute("/create-avatar")({
  component: CreateAvatarPage,
});

const archetypes = [
  { name: "Guerrero", desc: "Fuerza y resiliencia", emoji: "⚔️" },
  { name: "Sanador", desc: "Empatía y cuidado", emoji: "💚" },
  { name: "Explorador", desc: "Curiosidad y aventura", emoji: "🧭" },
  { name: "Sabio", desc: "Reflexión y conocimiento", emoji: "📖" },
];

function CreateAvatarPage() {
  const [step, setStep] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState<number | null>(null);
  const { updateUser } = useUserStore();
  const navigate = useNavigate();

  const handleFinish = () => {
    updateUser({
      name: name || "Héroe",
      avatar: selectedAvatar,
      archetype,
    });
    toast.success(`¡Bienvenido, ${name || "Héroe"}! Tu aventura comienza.`, {
      icon: "⚔️",
      duration: 3000,
    });
    navigate({ to: "/dashboard" });
  };

  const handleNext = () => {
    if (step === 0) {
      toast("Avatar seleccionado: " + AVATAR_META[selectedAvatar].name, { icon: "✨" });
    }
    if (step === 1 && !name.trim()) {
      toast.warning("Escribe tu nombre de héroe", { icon: "📝" });
      return;
    }
    if (step === 1) {
      toast("¡Gran nombre, " + name + "!", { icon: "🎉" });
    }
    setStep(step + 1);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 pt-12">
      <StarField />

      {/* Progress */}
      <div className="relative z-10 flex items-center gap-2 mb-8">
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              s <= step ? "bg-primary shadow-[0_0_8px_oklch(0.55_0.25_280/0.5)]" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      <div className="relative z-10 flex-1">
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-cinzel font-bold text-foreground">Elige tu Avatar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tu compañero en esta aventura</p>

            {/* Vista previa grande del avatar seleccionado */}
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-gradient-to-b from-primary/10 via-card to-card py-6">
              <AvatarIcon key={selectedAvatar} index={selectedAvatar} size={128} selected glow />
              <p className="mt-3 font-cinzel text-lg font-bold text-foreground">{AVATAR_META[selectedAvatar].name}</p>
              <p className="text-xs text-muted-foreground">{AVATAR_META[selectedAvatar].title}</p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {AVATAR_META.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAvatar(i)}
                  aria-label={`Elegir avatar ${a.name}`}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 py-3 transition-all duration-300 active:scale-90 ${
                    selectedAvatar === i
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105"
                      : "border-border bg-card hover:border-primary/50 hover:scale-105 hover:bg-card/80"
                  }`}
                >
                  <AvatarIcon index={i} size={52} />
                  <span className="text-[11px] font-medium text-foreground">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-cinzel font-bold text-foreground">¿Cómo te llamas?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tu nombre de héroe</p>
            <div className="mt-8">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de héroe..."
                maxLength={20}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <p className="mt-1 text-right text-[10px] text-muted-foreground">{name.length}/20</p>
              <div className={`mt-4 flex items-center gap-3 rounded-xl bg-card p-4 border transition-all duration-500 ${
                name ? "border-primary/50 shadow-md shadow-primary/10" : "border-border"
              }`}>
                <AvatarIcon index={selectedAvatar} size={56} className="animate-float" />
                <div>
                  <p className="font-semibold text-foreground text-lg">{name || "Héroe"}</p>
                  <p className="text-xs text-muted-foreground">Nivel 1 • Novato</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-cinzel font-bold text-foreground">Tu Arquetipo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Define tu estilo de juego</p>
            <div className="mt-6 space-y-3">
              {archetypes.map((a, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setArchetype(i);
                    toast(a.name + ": " + a.desc, { icon: a.emoji });
                  }}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-300 active:scale-95 ${
                    archetype === i
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]"
                      : "border-border bg-card hover:border-primary/50 hover:translate-x-1"
                  }`}
                >
                  <span className={`text-3xl transition-transform duration-300 ${archetype === i ? "scale-125" : ""}`}>{a.emoji}</span>
                  <div>
                    <p className="font-semibold text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                  {archetype === i && <Sparkles className="ml-auto h-4 w-4 text-primary animate-pulse" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="relative z-10 flex items-center justify-between py-6">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className={`flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-all active:scale-95 ${step === 0 ? "invisible" : ""}`}
        >
          <ChevronLeft className="h-4 w-4" /> Atrás
        </button>

        {step < 2 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-95 hover:scale-105"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={archetype === null}
            className="flex items-center gap-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ¡Comenzar! ⚔️
          </button>
        )}
      </div>
    </div>
  );
}
