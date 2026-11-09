// Creación del héroe en dos pasos: elegir uno de los 4 arquetipos (con su personaje 3D) y darle nombre.
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StarField } from "@/presentation/components/layout/StarField";
import { MiniAvatar3D } from "@/presentation/components/layout/MiniAvatar3D";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useUserStore } from "@/presentation/hooks/useUserStore";
import { ARCHETYPE_OPTIONS, getArchetypeStyle, withAlpha } from "@/domain/identity/archetype";
import { toast } from "sonner";

export const Route = createFileRoute("/create-avatar")({
  head: () => ({ meta: [
    { title: "Crea tu héroe | SoulSync" },
    { name: "description", content: "Elige tu arquetipo (Caballero, Bárbaro, Pícaro o Mago) y el nombre de tu héroe en SoulSync." },
    { property: "og:title", content: "Crea tu héroe | SoulSync" },
    { property: "og:description", content: "Elige tu arquetipo (Caballero, Bárbaro, Pícaro o Mago) y el nombre de tu héroe en SoulSync." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CreateAvatarPage,
});

const STEPS = 2;

function CreateAvatarPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { updateUser } = useUserStore();
  const navigate = useNavigate();
  const style = getArchetypeStyle(archetype);

  const handleFinish = async () => {
    if (saving || archetype === null) return;
    if (!name.trim()) {
      toast.warning("Escribe tu nombre de héroe");
      return;
    }
    setSaving(true);
    try {
      await updateUser({ name: name.trim(), archetype });
      toast.success(`¡Bienvenido, ${name.trim()}! Tu aventura como ${style.name} comienza.`, { icon: <GameIcon name={style.icon} className="h-5 w-5" style={{ color: style.accent }} />, duration: 3000 });
      navigate({ to: "/dashboard" });
    } catch {
      // El error ya se muestra vía el toast.error del propio hook
      // (profileMut.onError); simplemente no navegamos si falló el guardado.
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 pt-12">
      <StarField />

      {/* Progreso */}
      <div className="relative z-10 mb-8 flex items-center gap-2">
        {Array.from({ length: STEPS }, (_, s) => (
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
            <h2 className="text-2xl font-cinzel font-bold text-foreground">Elige tu Arquetipo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Será tu personaje y compañero en esta aventura</p>

            {/* Vista previa 3D del arquetipo elegido */}
            <div
              className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-border bg-card px-4 py-4 transition-colors duration-500"
              style={{ borderColor: archetype === null ? undefined : withAlpha(style.accent, 0.6), backgroundImage: `linear-gradient(to bottom, ${withAlpha(style.accent, 0.12)}, transparent)` }}
            >
              {archetype === null ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex gap-3" aria-hidden>{ARCHETYPE_OPTIONS.map((a) => <GameIcon key={a.index} name={a.icon} className="h-8 w-8" style={{ color: a.accent }} />)}</div>
                  <p className="text-sm text-muted-foreground">Toca un arquetipo para conocer a tu héroe</p>
                </div>
              ) : (
                <>
                  <MiniAvatar3D key={archetype} archetype={archetype} size={200} glowColor={style.glow} exposure={style.exposure} />
                  <p className="mt-1 flex items-center gap-2 font-cinzel text-xl font-bold text-foreground"><GameIcon name={style.icon} className="h-5 w-5" style={{ color: style.accent }} /> {style.name}</p>
                  <p className="text-sm font-medium" style={{ color: style.accent }}>{style.trait}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{style.gear}</p>
                </>
              )}
            </div>

            {/* Los 4 arquetipos */}
            <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Arquetipos">
              {ARCHETYPE_OPTIONS.map((a) => {
                const selected = archetype === a.index;
                return (
                  <button
                    key={a.index}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setArchetype(a.index)}
                    className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all duration-300 active:scale-95 ${
                      selected ? "shadow-lg" : "border-border bg-card hover:border-primary/50"
                    }`}
                    style={selected ? { borderColor: a.accent, backgroundColor: withAlpha(a.accent, 0.12), boxShadow: `0 8px 20px ${withAlpha(a.glow, 0.2)}` } : undefined}
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                      style={{ backgroundColor: withAlpha(a.accent, 0.18), boxShadow: `inset 0 0 0 1px ${withAlpha(a.accent, 0.5)}` }}
                      aria-hidden
                    >
                      <GameIcon name={a.icon} className="h-5 w-5" style={{ color: a.accent }} />
                    </span>
                    <span className="font-cinzel font-semibold text-foreground">{a.name}</span>
                    <span className="text-[11px] leading-tight text-muted-foreground">{a.trait}</span>
                    {selected && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-background" style={{ backgroundColor: a.accent }}>
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && archetype !== null && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-cinzel font-bold text-foreground">¿Cómo te llamas?</h2>
            <p className="mt-1 text-sm text-muted-foreground">El nombre de tu {style.name.toLowerCase()}</p>
            <div className="mt-8">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFinish()}
                placeholder="Nombre de héroe..."
                maxLength={20}
                autoFocus
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <p className="mt-1 text-right text-[10px] text-muted-foreground">{name.length}/20</p>

              {/* Resumen del héroe */}
              <div className="mt-4 flex items-center gap-3 rounded-xl border-2 bg-card p-3 transition-all duration-500" style={{ borderColor: name ? withAlpha(style.accent, 0.6) : undefined }}>
                <MiniAvatar3D archetype={archetype} size={96} rotate={false} interactive={false} glowColor={style.glow} exposure={style.exposure} />
                <div>
                  <p className="font-cinzel text-lg font-semibold text-foreground">{name.trim() || "Héroe"}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><GameIcon name={style.icon} className="h-3.5 w-3.5" style={{ color: style.accent }} /> {style.name} • Nivel 1</p>
                  <p className="text-[11px]" style={{ color: style.accent }}>{style.trait}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="relative z-10 flex items-center justify-between py-6">
        <button
          onClick={() => setStep(0)}
          className={`flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-all active:scale-95 ${step === 0 ? "invisible" : ""}`}
        >
          <ChevronLeft className="h-4 w-4" /> Atrás
        </button>

        {step === 0 ? (
          <button
            onClick={() => setStep(1)}
            disabled={archetype === null}
            className="flex items-center gap-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {archetype === null ? "Elige un arquetipo" : `Ser ${style.name}`} <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!name.trim() || saving}
            className="flex items-center gap-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {saving ? "Guardando..." : <>¡Comenzar! <GameIcon name={style.icon} className="h-4 w-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
}
