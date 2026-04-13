import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { StarField } from "@/components/StarField";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/create-avatar")({
  component: CreateAvatarPage,
});

const avatars = ["🧙‍♂️", "🧝‍♀️", "🐉", "🦊", "🌟", "🦉"];
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

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 pt-12">
      <StarField />

      {/* Progress */}
      <div className="relative z-10 flex items-center gap-2 mb-8">
        {[0, 1, 2].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-secondary"}`} />
        ))}
      </div>

      <div className="relative z-10 flex-1">
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-cinzel font-bold text-foreground">Elige tu Avatar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tu compañero en esta aventura</p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {avatars.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(i)}
                  className={`flex h-24 items-center justify-center rounded-2xl border-2 text-4xl transition-all ${
                    selectedAvatar === i
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  {a}
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
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-card p-4">
                <span className="text-3xl">{avatars[selectedAvatar]}</span>
                <div>
                  <p className="font-semibold text-foreground">{name || "Héroe"}</p>
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
                  onClick={() => setArchetype(i)}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    archetype === i
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <div>
                    <p className="font-semibold text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
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
          className={`flex items-center gap-1 text-sm text-muted-foreground ${step === 0 ? "invisible" : ""}`}
        >
          <ChevronLeft className="h-4 w-4" /> Atrás
        </button>

        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to="/dashboard"
            className="flex items-center gap-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
          >
            ¡Comenzar! ⚔️
          </Link>
        )}
      </div>
    </div>
  );
}
