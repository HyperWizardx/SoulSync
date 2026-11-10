// Perfiles del grupo (k-means propio): solo agregados de 3 o más estudiantes, con sus rasgos
// más marcados y un taller sugerido para Bienestar Universitario.
import { Users } from "lucide-react";
import { PROFILE_DIMENSIONS } from "@/domain/research/clustering";
import type { ProfilesReport } from "@/service/server-functions/admin.functions";

const fmt = (key: string, v: number) =>
  key === "regularity" || key === "lateNights" ? `${Math.round(v * 100)}%` : key === "missions" ? v.toFixed(1) : key === "sleep" ? `${v.toFixed(1)} h` : v.toFixed(1);

export function ProfilesPanel({ profiles }: { profiles: ProfilesReport | null | undefined }) {
  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-4" aria-labelledby="profiles-title">
      <h2 id="profiles-title" className="font-semibold text-foreground">Perfiles del grupo</h2>
      <p className="text-xs text-muted-foreground">
        Agrupación propia (k-means) por hábitos y ánimo de las últimas 2 semanas, solo con consentimiento vigente. Cada perfil
        reúne al menos 3 estudiantes y nunca muestra quiénes son: sirve para orientar talleres.
      </p>
      {!profiles ? (
        <p className="mt-3 rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
          Aún no hay suficientes estudiantes con 5 o más check-ins en 2 semanas para formar perfiles sin identificar a nadie.
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted-foreground">{profiles.students} estudiantes · {profiles.k} perfiles · silueta {profiles.silhouette}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {profiles.profiles.map((p) => (
              <article key={p.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" aria-hidden />{p.size} · {Math.round(p.share * 100)}%</span>
                </div>
                {p.traits.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p.traits.map((t) => <span key={t} className="rounded-full bg-card px-2 py-0.5 text-[11px] text-foreground">{t}</span>)}
                  </div>
                )}
                {p.workshop && <p className="mt-2 text-xs text-primary">Taller sugerido: {p.workshop}</p>}
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {PROFILE_DIMENSIONS.map((d) => (
                    <div key={d.key} className="flex justify-between gap-2"><dt>{d.label}</dt><dd className="text-foreground">{fmt(d.key, p.means[d.key])}</dd></div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
