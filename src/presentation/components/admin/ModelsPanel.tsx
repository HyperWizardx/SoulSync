// Panel "Modelos de IA" (rol investigación): versiones registradas de la brújula y del recomendador,
// y cómo le va al recomendador en los últimos 30 días (recomendaciones mostradas y aceptadas).
import { useModelsReport } from "@/presentation/hooks/useAdmin";
import { StatTile } from "@/presentation/components/admin/DashboardCharts";

const KIND_LABEL: Record<string, string> = { brujula: "Brújula", recomendador: "Recomendador" };
const CATEGORY_LABEL: Record<string, string> = { autocuidado: "Autocuidado", reflexion: "Reflexión", movimiento: "Movimiento", social: "Social", cognitivo: "Cognitivo", ar: "AR" };

export function ModelsPanel({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useModelsReport(enabled);
  if (!enabled) return null;
  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-4">
      <h2 className="font-semibold text-foreground">Modelos de IA</h2>
      <p className="mb-3 text-xs text-muted-foreground">Versiones registradas y desempeño del recomendador propio (últimos 30 días, participantes con consentimiento).</p>
      {isLoading || !data ? (
        <div className="h-24 animate-pulse rounded-xl bg-secondary/40" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr><th className="py-1 pr-3 font-medium">Versión</th><th className="py-1 pr-3 font-medium">Tipo</th><th className="py-1 pr-3 font-medium">Estado</th><th className="py-1 font-medium">Descripción</th></tr>
              </thead>
              <tbody>
                {data.models.map((m) => (
                  <tr key={m.version} className="border-t border-border align-top">
                    <td className="py-2 pr-3 font-mono text-foreground">{m.version}</td>
                    <td className="py-2 pr-3 text-foreground">{KIND_LABEL[m.kind] ?? m.kind}</td>
                    <td className="py-2 pr-3">{m.active ? <span className="rounded-full bg-soul-teal/15 px-2 py-0.5 text-soul-teal">Activo</span> : <span className="text-muted-foreground">Inactivo</span>}</td>
                    <td className="py-2 text-muted-foreground">{m.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatTile label="Recomendadas" value={data.recommender.shown} />
            <StatTile label="Aceptadas" value={data.recommender.taken} tone="ok" />
            <StatTile label="Aceptación" value={`${data.recommender.acceptance}%`} />
          </div>
          {data.recommender.byCategory.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {data.recommender.byCategory.map((c) => (
                <li key={c.category} className="text-xs">
                  <div className="flex justify-between text-muted-foreground"><span>{CATEGORY_LABEL[c.category] ?? c.category}</span><span>{c.taken}/{c.shown} · {c.acceptance}%</span></div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${c.acceptance}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
