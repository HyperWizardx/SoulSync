// Pronóstico de tu ánimo: los últimos registros y lo que se espera en los próximos (Holt propio).
// Si anticipa una bajada, invita a prepararse con una misión de autocuidado. Orientativo.
import { Link } from "@tanstack/react-router";
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { SKY_COPY, type ForecastSky, type MoodForecast } from "@/domain/wellbeing/forecast";
import type { CheckinRecord } from "@/domain/wellbeing/types";

const SKY_STYLE: Record<ForecastSky, { icon: string; box: string; text: string }> = {
  despejado: { icon: "sun", box: "border-soul-teal/40 bg-soul-teal/5", text: "text-soul-teal" },
  nubes: { icon: "cloud-ring", box: "border-soul-gold/40 bg-soul-gold/5", text: "text-soul-gold" },
  // Tono cálido, no alarmante: es una estimación, no un veredicto.
  tormenta: { icon: "raining", box: "border-soul-gold/50 bg-soul-gold/10", text: "text-soul-gold" },
};

const W = 280;
const H = 72;
const x = (i: number, n: number) => 8 + (i * (W - 16)) / Math.max(1, n - 1);
const y = (mood: number) => 8 + ((5 - mood) * (H - 16)) / 4;

export function MoodForecastCard({ forecast, checkins }: { forecast: MoodForecast; checkins: CheckinRecord[] }) {
  const style = SKY_STYLE[forecast.sky];
  const copy = SKY_COPY[forecast.sky];
  const history = [...checkins].sort((a, b) => a.date.localeCompare(b.date)).slice(-7).map((c) => c.mood);
  const n = history.length + forecast.forecast.length;
  const pts = history.map((m, i) => `${x(i, n)},${y(m)}`).join(" ");
  const last = history.length - 1;
  const future = [history[last], ...forecast.forecast].map((m, i) => `${x(last + i, n)},${y(m)}`).join(" ");
  const band = [
    ...forecast.upper.map((m, i) => `${x(last + 1 + i, n)},${y(m)}`),
    ...[...forecast.lower].reverse().map((m, i) => `${x(last + forecast.lower.length - i, n)},${y(m)}`),
  ].join(" ");

  return (
    <section className={`rounded-2xl border p-4 ${style.box}`} aria-labelledby="forecast-title">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Pronóstico de tu ánimo</p>
      <div className="mt-1 flex items-start gap-3">
        <GameIcon name={style.icon} className={`h-8 w-8 shrink-0 ${style.text}`} />
        <div>
          <h2 id="forecast-title" className={`font-cinzel font-semibold ${style.text}`}>{copy.title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{copy.body}</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-20 w-full" role="img" aria-label={`Ánimo reciente y esperado: ${forecast.forecast.map((v) => v.toFixed(1)).join(", ")} de 5`}>
        {[1, 3, 5].map((m) => <line key={m} x1={8} x2={W - 8} y1={y(m)} y2={y(m)} stroke="currentColor" className="text-border" strokeWidth={1} />)}
        <polygon points={band} fill="currentColor" className={style.text} opacity={0.15} />
        <polyline points={pts} fill="none" stroke="currentColor" className="text-primary" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={future} fill="none" stroke="currentColor" className={style.text} strokeWidth={2.5} strokeDasharray="5 4" strokeLinecap="round" />
        {forecast.forecast.map((m, i) => <circle key={i} cx={x(last + 1 + i, n)} cy={y(m)} r={3} fill="currentColor" className={style.text} />)}
      </svg>
      <div className="flex justify-between text-[11px] text-muted-foreground"><span>Tus últimos registros</span><span>Próximos días</span></div>

      {forecast.dip && (
        <Link to="/missions" search={{ cat: "autocuidado" }} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          Prepararme con una misión de autocuidado
        </Link>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">Estimación con tus últimos {forecast.points} registros. Orientativa, no es un diagnóstico.</p>
    </section>
  );
}
