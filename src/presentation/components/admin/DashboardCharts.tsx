/** Gráficos reutilizables de los paneles (recharts + tokens de color del tema). */
import type { ReactNode } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { DashboardSeries } from "@/domain/research/dashboard";

const C = {
  primary: "var(--primary)", teal: "var(--soul-teal)", gold: "var(--soul-gold)",
  danger: "var(--destructive)", muted: "var(--muted-foreground)", grid: "var(--border)",
};
const tooltip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--foreground)" } };
const axis = { stroke: C.muted, fontSize: 11, tickLine: false, axisLine: false } as const;
const short = (d: string) => d.slice(5);

export function ChartCard({ title, hint, children, className = "" }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-4 ${className}`}>
      <h2 className="font-semibold text-foreground">{title}</h2>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 h-56">{children}</div>
    </section>
  );
}

export function MoodStressChart({ data }: { data: { date: string; mood: number | null; stress: number | null; sleep?: number | null }[] }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={short} {...axis} />
        <YAxis domain={[1, 5]} {...axis} width={24} />
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="mood" name="Ánimo" stroke={C.teal} strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="stress" name="Estrés" stroke={C.danger} strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SleepChart({ data }: { data: { date: string; sleep: number | null }[] }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data}>
        <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={short} {...axis} />
        <YAxis domain={[0, 10]} {...axis} width={24} />
        <Tooltip {...tooltip} />
        <Area type="monotone" dataKey="sleep" name="Horas de sueño" stroke={C.primary} fill={C.primary} fillOpacity={0.2} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RiskHistoryChart({ data }: { data: DashboardSeries["riskHistory"] }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={short} {...axis} />
        <YAxis allowDecimals={false} {...axis} width={24} />
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="bajo" name="Bajo" stackId="r" fill={C.teal} />
        <Bar dataKey="moderado" name="Moderado" stackId="r" fill={C.gold} />
        <Bar dataKey="alto" name="Alto" stackId="r" fill={C.danger} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({ data, dataKey = "count", label = "label", name = "Participantes" }: { data: Record<string, string | number>[]; dataKey?: string; label?: string; name?: string }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <XAxis type="number" allowDecimals={false} {...axis} />
        <YAxis type="category" dataKey={label} width={130} {...axis} />
        <Tooltip {...tooltip} />
        <Bar dataKey={dataKey} name={name} fill={C.primary} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data }: { data: { category: string; completed: number; skipped: number }[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
        <XAxis dataKey="category" {...axis} />
        <YAxis allowDecimals={false} {...axis} width={24} />
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="completed" name="Completadas" fill={C.teal} radius={[4, 4, 0, 0]} />
        <Bar dataKey="skipped" name="Omitidas" fill={C.gold} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: { name: string; value: number; tone: keyof typeof C }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <Empty />;
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
          {data.map((d) => <Cell key={d.name} fill={C[d.tone]} stroke="none" />)}
        </Pie>
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ActivityChart({ data }: { data: DashboardSeries["daily"] }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={short} {...axis} />
        <YAxis allowDecimals={false} {...axis} width={24} />
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="checkins" name="Check-ins" fill={C.primary} radius={[4, 4, 0, 0]} />
        <Bar dataKey="missions" name="Misiones" fill={C.teal} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreHistoryChart({ data }: { data: { date: string; score: number | null }[] }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data}>
        <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={short} {...axis} />
        <YAxis domain={[0, 1]} {...axis} width={28} />
        <Tooltip {...tooltip} />
        <Area type="monotone" dataKey="score" name="Índice" stroke={C.gold} fill={C.gold} fillOpacity={0.2} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Aún no hay datos suficientes.</div>;
}

export function StatTile({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "danger" | "warn" | "ok" }) {
  const color = tone === "danger" ? "text-destructive" : tone === "warn" ? "text-soul-gold" : tone === "ok" ? "text-soul-teal" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
