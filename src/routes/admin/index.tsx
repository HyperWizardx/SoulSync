import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { AdminShell } from "@/presentation/components/admin/AdminShell";
import { useAdminAccess, usePsychologistDashboard, useStudents } from "@/presentation/hooks/useAdmin";
import { ChartCard, DonutChart, HorizontalBars, MoodStressChart, RiskHistoryChart, StatTile } from "@/presentation/components/admin/DashboardCharts";
import type { StudentRow } from "@/service/server-functions/admin.functions";
import { AlertsPanel } from "@/presentation/components/admin/AlertsPanel";

export const Route = createFileRoute("/admin/")({
  component: AdminStudentsPage,
  head: () => ({
    meta: [
      { title: "Panel de seguimiento | SoulSync" },
      { name: "description", content: "Panel para psicólogos: seguimiento del bienestar, adherencia y señales preventivas de los estudiantes participantes." },
      { property: "og:title", content: "Panel de seguimiento | SoulSync" },
      { property: "og:description", content: "Seguimiento clínico-exploratorio de los estudiantes participantes en SoulSync." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const RISK_CLASS: Record<string, string> = {
  alto: "bg-destructive/15 text-destructive",
  moderado: "bg-amber-500/15 text-amber-500",
  bajo: "bg-emerald-500/15 text-emerald-500",
  insuficiente: "bg-muted text-muted-foreground",
};

const CONSENT_LABEL: Record<StudentRow["consent"], string> = {
  vigente: "Consentimiento vigente",
  revocado: "Revocado",
  ninguno: "Sin consentimiento",
  desactualizado: "Versión anterior",
};

function AdminStudentsPage() {
  const { data: access } = useAdminAccess();
  const { data: students, isLoading } = useStudents(Boolean(access?.psicologo));
  const { data: dash } = usePsychologistDashboard(Boolean(access?.psicologo));
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<string>("todos");
  const [consent, setConsent] = useState<string>("todos");

  const rows = useMemo(() => {
    const list = students ?? [];
    return list.filter((s) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        q === "" ||
        s.name.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        s.participantCode.toLowerCase().includes(q);
      const matchRisk = risk === "todos" || s.riskLevel === risk;
      const matchConsent = consent === "todos" || s.consent === consent;
      return matchQ && matchRisk && matchConsent;
    });
  }, [students, query, risk, consent]);

  const today = new Date().toISOString().slice(0, 10);
  const summary = useMemo(() => {
    const list = students ?? [];
    return {
      total: list.length,
      consented: list.filter((s) => s.consent === "vigente").length,
      alto: list.filter((s) => s.riskLevel === "alto").length,
      activos: list.filter((s) => s.lastActivity?.slice(0, 10) === today).length,
    };
  }, [students, today]);

  return (
    <AdminShell title="Seguimiento de estudiantes" subtitle="Rol psicología · datos identificados" requires="psicologo">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Participantes", value: summary.total, icon: Users },
          { label: "Con consentimiento", value: summary.consented, icon: ShieldCheck },
          { label: "Señal alta", value: summary.alto, icon: AlertTriangle },
          { label: "Activos hoy", value: summary.activos, icon: Activity },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
            <c.icon className="mb-2 h-4 w-4 text-primary" />
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {dash && (
        <>
          <AlertsPanel alerts={dash.alerts} />
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Reglas de seguridad activas" value={dash.dashboard.safetyFlagged} tone={dash.dashboard.safetyFlagged ? "danger" : "ok"} />
            <StatTile label="Sin check-in hace 3+ días" value={dash.dashboard.noCheckin3d} tone={dash.dashboard.noCheckin3d ? "warn" : "ok"} />
            <StatTile label="Señal moderada" value={(students ?? []).filter((s) => s.riskLevel === "moderado").length} tone="warn" />
            <StatTile label="Seguimientos pendientes" value={dash.alerts.filter((a) => a.followUpPending).length} tone={dash.alerts.some((a) => a.followUpPending) ? "warn" : "ok"} />
          </div>
          <div className="mb-5 grid gap-3 lg:grid-cols-2">
            <ChartCard title="Ánimo y estrés del grupo" hint="Promedio diario (1–5), últimos 14 días, solo con consentimiento.">
              <MoodStressChart data={dash.dashboard.daily} />
            </ChartCard>
            <ChartCard title="Señales por día" hint="Predicciones registradas por nivel.">
              <RiskHistoryChart data={dash.dashboard.riskHistory} />
            </ChartCard>
            <ChartCard title="Factores más frecuentes" hint="Cuántos estudiantes tienen cada factor entre sus 3 principales.">
              <HorizontalBars data={dash.dashboard.topFactors} />
            </ChartCard>
            <ChartCard title="Distribución actual de riesgo">
              <DonutChart data={[
                { name: "Alto", value: summary.alto, tone: "danger" },
                { name: "Moderado", value: (students ?? []).filter((s) => s.riskLevel === "moderado").length, tone: "gold" },
                { name: "Bajo", value: (students ?? []).filter((s) => s.riskLevel === "bajo").length, tone: "teal" },
                { name: "Insuficiente", value: (students ?? []).filter((s) => s.riskLevel === "insuficiente").length, tone: "muted" },
              ]} />
            </ChartCard>
          </div>
          <h2 className="mb-2 font-semibold text-foreground">Todos los estudiantes</h2>
        </>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o código"
            aria-label="Buscar estudiante"
            className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <select value={risk} onChange={(e) => setRisk(e.target.value)} aria-label="Filtrar por riesgo" className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground">
          <option value="todos">Todo riesgo</option>
          <option value="alto">Alto</option>
          <option value="moderado">Moderado</option>
          <option value="bajo">Bajo</option>
          <option value="insuficiente">Datos insuficientes</option>
        </select>
        <select value={consent} onChange={(e) => setConsent(e.target.value)} aria-label="Filtrar por consentimiento" className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground">
          <option value="todos">Todo consentimiento</option>
          <option value="vigente">Vigente</option>
          <option value="ninguno">Sin consentimiento</option>
          <option value="revocado">Revocado</option>
          <option value="desactualizado">Versión anterior</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No hay estudiantes que coincidan con los filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                {["Estudiante", "Código", "Señal", "Confianza", "Tendencia", "WHO-5", "Seguimiento", "Cobertura", "Check-ins 14d", "Misiones 7d", "Omitidas 7d", "Racha", "Último check-in", "Consentimiento"].map((h) => (
                  <th key={h} className="px-3 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.userId} className="border-b border-border/50 last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-3">
                    <Link to="/admin/estudiante/$id" params={{ id: s.userId }} className="font-medium text-foreground hover:text-primary">
                      {s.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{s.email ?? "—"}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.participantCode}</td>
                  <td className="px-3 py-3">
                    {s.riskLevel ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${RISK_CLASS[s.riskLevel]}`}>{s.riskLevel}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs capitalize text-muted-foreground">{s.confidence ?? "—"}{s.safetyFlags ? <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-destructive" aria-label="Revisión prioritaria" /> : null}</td>
                  <td className="px-3 py-3 text-xs capitalize text-muted-foreground">{s.trend ?? "—"}</td>
                  <td className={`px-3 py-3 text-xs ${s.who5Raw != null && s.who5Raw <= 7 ? "font-semibold text-destructive" : s.who5Raw != null && s.who5Raw < 13 ? "text-amber-500" : "text-muted-foreground"}`}>{s.who5Raw != null ? `${s.who5Raw}/25` : "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.lastFollowUp ? new Date(s.lastFollowUp).toLocaleDateString("es-CO") : "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.consent === "vigente" ? `${Math.round(s.coverage * 100)}%` : "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.consent === "vigente" ? s.checkins14 : "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.missions7}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.skipped7}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.streak}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.lastCheckin ?? "—"}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs ${s.consent === "vigente" ? "text-emerald-500" : "text-amber-500"}`}>
                      {CONSENT_LABEL[s.consent]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
