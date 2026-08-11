import { ShieldCheck, Info } from "lucide-react";
import { useState } from "react";
import { CONSENT_VERSION } from "@/lib/wellbeing/types";
import { DISCLAIMER, MODEL_NOTE } from "@/lib/wellbeing/copy";

interface Props {
  accepted: boolean;
  acceptedAt: string | null;
  wearablesOptIn: boolean;
  pending: boolean;
  onChange: (accepted: boolean, wearablesOptIn: boolean) => void;
}

export function ConsentCard({ accepted, acceptedAt, wearablesOptIn, pending, onChange }: Props) {
  const [wearables, setWearables] = useState(wearablesOptIn);

  if (accepted) {
    return (
      <div className="rounded-2xl border border-soul-teal/30 bg-soul-teal/5 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-soul-teal" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Consentimiento activo</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Versión {CONSENT_VERSION}
              {acceptedAt ? ` · aceptado el ${new Date(acceptedAt).toLocaleDateString("es-CO")}` : ""}
            </p>
            <button
              onClick={() => onChange(false, false)}
              disabled={pending}
              className="mt-3 min-h-11 rounded-lg border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
            >
              Revocar y eliminar mis datos de bienestar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="font-cinzel font-semibold text-foreground">Consentimiento informado</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            El módulo de Predicción de bienestar forma parte de un prototipo de investigación con estudiantes de
            Ingeniería de Sistemas de la Universidad del Sinú (Montería). Si aceptas, la app analizará:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>• Tus check-ins de ánimo, estrés, energía, conexión social y sueño.</li>
            <li>• Tu patrón de uso de la app (misiones completadas, constancia).</li>
            <li>• Escalas de bienestar que respondas dentro de la app, si las hay.</li>
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            No se recogen textos libres ni información clínica. Puedes revocar el consentimiento cuando quieras y tus
            datos del módulo se eliminan.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{MODEL_NOTE}</p>

          <label className="mt-3 flex min-h-11 items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={wearables}
              onChange={(e) => setWearables(e.target.checked)}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            Autorizo también señales de wearables, si en el futuro las conecto (opcional).
          </label>

          <button
            onClick={() => onChange(true, wearables)}
            disabled={pending}
            className="mt-3 min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Acepto participar"}
          </button>
        </div>
      </div>
    </div>
  );
}
