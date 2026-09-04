import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runInference } from "@/lib/wellbeing/inference";
import { extractFeatures } from "@/lib/wellbeing/features";
import { CONSENT_VERSION } from "@/lib/wellbeing/types";
import type {
  CheckinRecord,
  FactorExplanation,
  PredictionInput,
  TaskCategory,
  TaskStatus,
} from "@/lib/wellbeing/types";
import {
  aggregatePopulation,
  participantCode,
  toCsv,
  type PopulationMetrics,
  type StudentRow,
} from "@/lib/admin/aggregate";

export type { StudentRow, PopulationMetrics } from "@/lib/admin/aggregate";

type Ctx = { supabase: any; userId: string };

export interface AdminAccess {
  psicologo: boolean;
  investigador: boolean;
  isAdmin: boolean;
}

async function readAccess(context: Ctx): Promise<AdminAccess> {
  const [p, i] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "psicologo" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "investigador" }),
  ]);
  const psicologo = Boolean(p.data);
  const investigador = Boolean(i.data);
  return { psicologo, investigador, isAdmin: psicologo || investigador };
}

async function requireRole(context: Ctx, role: "psicologo" | "investigador") {
  const access = await readAccess(context);
  if (!access[role]) {
    throw new Error("Acceso restringido: no tienes permisos de administración para esta vista.");
  }
  return access;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

function consentState(row: { consent_version: string; revoked_at: string | null } | undefined) {
  if (!row) return "ninguno" as const;
  if (row.revoked_at) return "revocado" as const;
  return row.consent_version === CONSENT_VERSION ? ("vigente" as const) : ("desactualizado" as const);
}

function buildInput(
  today: string,
  checkins: CheckinRecord[],
  missionsByDate: Record<string, number>,
  dailyGoal: number,
  lastMissionDate: string | null,
  taskEvents: { date: string; missionId: string; status: TaskStatus; category: TaskCategory; durationSeconds: number }[],
): PredictionInput {
  return {
    today,
    checkins,
    telemetry: { missionsByDate, dailyGoal, lastMissionDate },
    taskEvents,
  };
}

/** Índice que agrupa filas por user_id. */
function groupBy<T extends { user_id: string }>(rows: T[] | null): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows ?? []) {
    const list = map.get(r.user_id);
    if (list) list.push(r);
    else map.set(r.user_id, [r]);
  }
  return map;
}

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAccess> => readAccess(context as unknown as Ctx));

async function loadStudentRows(context: Ctx, withEmails: boolean): Promise<StudentRow[]> {
  const today = todayISO();
  const since = daysAgoISO(13);
  const sinceTs = new Date(Date.now() - 13 * 86_400_000).toISOString();
  const { supabase } = context;

  const [profiles, consents, checkins, missions, tasks] = await Promise.all([
    supabase.from("profiles").select("user_id, name, level, streak, archetype, daily_goal, last_mission_date"),
    supabase.from("research_consent").select("user_id, consent_version, revoked_at, accepted_at").order("accepted_at", { ascending: false }),
    supabase.from("wellbeing_checkins").select("user_id, checkin_date, mood, stress, energy, social, sleep_hours").gte("checkin_date", since),
    supabase.from("mission_completions").select("user_id, completed_date, completed_at").gte("completed_at", sinceTs),
    supabase.from("task_events").select("user_id, occurred_date, mission_id, status, category, duration_seconds").gte("occurred_date", since),
  ]);

  const emails = new Map<string, string>();
  if (withEmails) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) if (u.email) emails.set(u.id, u.email);
  }

  const consentByUser = new Map<string, { consent_version: string; revoked_at: string | null }>();
  for (const c of consents.data ?? []) if (!consentByUser.has(c.user_id)) consentByUser.set(c.user_id, c);

  const checkinsByUser = groupBy(checkins.data);
  const missionsByUser = groupBy(missions.data);
  const tasksByUser = groupBy(tasks.data);

  return (profiles.data ?? []).map((p: any) => {
    const consent = consentState(consentByUser.get(p.user_id));
    const userCheckins: CheckinRecord[] = (checkinsByUser.get(p.user_id) ?? []).map((c: any) => ({
      date: c.checkin_date,
      mood: c.mood,
      stress: c.stress,
      energy: c.energy,
      social: c.social,
      sleepHours: c.sleep_hours === null ? null : Number(c.sleep_hours),
    }));
    const userMissions = missionsByUser.get(p.user_id) ?? [];
    const userTasks = tasksByUser.get(p.user_id) ?? [];

    const missionsByDate: Record<string, number> = {};
    for (const m of userMissions) missionsByDate[(m as any).completed_date] = (missionsByDate[(m as any).completed_date] ?? 0) + 1;

    const within7 = (d: string) =>
      (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${d}T00:00:00Z`)) / 86_400_000 < 7;
    const missions7 = userMissions.filter((m: any) => within7(m.completed_date)).length;
    const skipped7 = userTasks.filter((t: any) => t.status === "skipped" && within7(t.occurred_date)).length;
    const goal = Math.max(1, p.daily_goal ?? 3);

    const base = {
      userId: p.user_id as string,
      participantCode: participantCode(p.user_id),
      name: (p.name as string) ?? "Héroe",
      email: withEmails ? (emails.get(p.user_id) ?? null) : null,
      level: (p.level as number) ?? 1,
      streak: (p.streak as number) ?? 0,
      archetype: (p.archetype as number | null) ?? null,
      consent,
      checkins14: userCheckins.length,
      missions7,
      skipped7,
      adherence7: userMissions.length === 0 && userTasks.length === 0 ? null : Math.min(1, missions7 / (goal * 7)),
      lastCheckin: userCheckins.map((c) => c.date).sort().at(-1) ?? null,
      lastActivity:
        [...userMissions.map((m: any) => m.completed_at as string)].sort().at(-1) ??
        (p.last_mission_date ? `${p.last_mission_date}T00:00:00Z` : null),
    };

    if (consent !== "vigente") {
      return { ...base, riskLevel: null, score: null, trend: null, coverage: 0 } satisfies StudentRow;
    }

    const prediction = runInference(
      buildInput(
        today,
        userCheckins,
        missionsByDate,
        goal,
        (p.last_mission_date as string | null) ?? null,
        userTasks.map((t: any) => ({
          date: t.occurred_date,
          missionId: t.mission_id,
          status: t.status,
          category: t.category,
          durationSeconds: Number(t.duration_seconds ?? 0),
        })),
      ),
    );

    return {
      ...base,
      riskLevel: prediction.riskLevel,
      score: prediction.score,
      trend: prediction.trend,
      coverage: prediction.coverage,
    } satisfies StudentRow;
  });
}

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudentRow[]> => {
    const ctx = context as unknown as Ctx;
    await requireRole(ctx, "psicologo");
    const rows = await loadStudentRows(ctx, true);
    return rows.sort((a, b) => {
      const order: Record<string, number> = { alto: 0, moderado: 1, bajo: 2, insuficiente: 3 };
      const ra = a.riskLevel ? order[a.riskLevel] : 4;
      const rb = b.riskLevel ? order[b.riskLevel] : 4;
      return ra - rb || a.name.localeCompare(b.name);
    });
  });

export const getPopulationMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ metrics: PopulationMetrics; rows: StudentRow[] }> => {
    const ctx = context as unknown as Ctx;
    await requireRole(ctx, "investigador");
    const rows = (await loadStudentRows(ctx, false)).map((r) => ({ ...r, name: r.participantCode, email: null }));
    return { metrics: aggregatePopulation(rows, todayISO()), rows };
  });

export interface StudentDetail {
  row: StudentRow;
  checkins: CheckinRecord[];
  explanation: FactorExplanation[];
  insufficientReason: string | null;
  predictions: { generatedAt: string; riskLevel: string; trend: string; score: number | null; coverage: number }[];
  missions: { title: string; completedAt: string; xp: number; isAr: boolean; category: string }[];
  tasksByCategory: { category: string; completed: number; skipped: number }[];
  timeline: { id: string; kind: string; title: string; detail: string | null; occurredAt: string }[];
  scales: { code: string; raw: number; max: number; answeredAt: string }[];
  world: { vitality: number; harmony: number; zonesUnlocked: number; season: string } | null;
  stats: { bienestar: number; resiliencia: number; energia: number; claridad: number } | null;
  attributes: Record<string, number> | null;
}

export const getStudentDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<StudentDetail> => {
    const ctx = context as unknown as Ctx;
    await requireRole(ctx, "psicologo");
    const { supabase } = ctx;
    const uid = data.userId;
    const today = todayISO();
    const since30 = daysAgoISO(29);

    const [rows, checkinRes, predRes, missionRes, taskRes, timelineRes, scaleRes, worldRes, statRes, attrRes] =
      await Promise.all([
        loadStudentRows(ctx, true),
        supabase.from("wellbeing_checkins").select("checkin_date, mood, stress, energy, social, sleep_hours").eq("user_id", uid).gte("checkin_date", since30).order("checkin_date", { ascending: true }),
        supabase.from("wellbeing_predictions").select("generated_at, risk_level, trend, score, coverage").eq("user_id", uid).order("generated_at", { ascending: false }).limit(30),
        supabase.from("mission_completions").select("title, completed_at, xp_earned, is_ar, category").eq("user_id", uid).order("completed_at", { ascending: false }).limit(40),
        supabase.from("task_events").select("status, category").eq("user_id", uid).gte("occurred_date", since30),
        supabase.from("timeline_events").select("id, kind, title, detail, occurred_at").eq("user_id", uid).order("occurred_at", { ascending: false }).limit(40),
        supabase.from("wellbeing_scales").select("scale_code, raw_score, max_score, answered_at").eq("user_id", uid).order("answered_at", { ascending: false }).limit(10),
        supabase.from("world_state").select("vitality, harmony, zones_unlocked, season").eq("user_id", uid).maybeSingle(),
        supabase.from("user_stats").select("bienestar, resiliencia, energia, claridad").eq("user_id", uid).maybeSingle(),
        supabase.from("user_attributes").select("*").eq("user_id", uid).maybeSingle(),
      ]);

    const row = rows.find((r) => r.userId === uid);
    if (!row) throw new Error("Estudiante no encontrado.");

    const checkins: CheckinRecord[] = (checkinRes.data ?? []).map((c: any) => ({
      date: c.checkin_date,
      mood: c.mood,
      stress: c.stress,
      energy: c.energy,
      social: c.social,
      sleepHours: c.sleep_hours === null ? null : Number(c.sleep_hours),
    }));

    let explanation: FactorExplanation[] = [];
    let insufficientReason: string | null = null;
    if (row.consent === "vigente") {
      const taskEvents = (taskRes.data ?? []).map((t: any) => ({
        date: today,
        missionId: "",
        status: t.status as TaskStatus,
        category: t.category as TaskCategory,
        durationSeconds: 0,
      }));
      const input = buildInput(today, checkins, {}, 3, null, taskEvents);
      extractFeatures(input);
      const prediction = runInference(input);
      explanation = prediction.explanation;
      insufficientReason = prediction.insufficientReason ?? null;
    }

    const byCat = new Map<string, { completed: number; skipped: number }>();
    for (const t of taskRes.data ?? []) {
      const entry = byCat.get((t as any).category) ?? { completed: 0, skipped: 0 };
      if ((t as any).status === "completed") entry.completed += 1;
      if ((t as any).status === "skipped") entry.skipped += 1;
      byCat.set((t as any).category, entry);
    }

    const { user_id: _omit, updated_at: _omit2, ...attrs } = (attrRes.data ?? {}) as Record<string, any>;

    return {
      row,
      checkins,
      explanation,
      insufficientReason,
      predictions: (predRes.data ?? []).map((p: any) => ({
        generatedAt: p.generated_at,
        riskLevel: p.risk_level,
        trend: p.trend,
        score: p.score === null ? null : Number(p.score),
        coverage: Number(p.coverage ?? 0),
      })),
      missions: (missionRes.data ?? []).map((m: any) => ({
        title: m.title,
        completedAt: m.completed_at,
        xp: m.xp_earned,
        isAr: m.is_ar,
        category: m.category,
      })),
      tasksByCategory: [...byCat.entries()].map(([category, v]) => ({ category, ...v })),
      timeline: (timelineRes.data ?? []).map((t: any) => ({
        id: t.id,
        kind: t.kind,
        title: t.title,
        detail: t.detail,
        occurredAt: t.occurred_at,
      })),
      scales: (scaleRes.data ?? []).map((s: any) => ({
        code: s.scale_code,
        raw: Number(s.raw_score),
        max: Number(s.max_score),
        answeredAt: s.answered_at,
      })),
      world: worldRes.data
        ? {
            vitality: worldRes.data.vitality,
            harmony: worldRes.data.harmony,
            zonesUnlocked: worldRes.data.zones_unlocked,
            season: worldRes.data.season,
          }
        : null,
      stats: statRes.data ?? null,
      attributes: Object.keys(attrs).length ? (attrs as Record<string, number>) : null,
    };
  });

export const DATASETS = ["checkins", "task_events", "missions", "predictions", "scales", "resumen"] as const;
export type DatasetKey = (typeof DATASETS)[number];

export const exportDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dataset: z.enum(DATASETS) }).parse(d))
  .handler(async ({ data, context }): Promise<{ filename: string; csv: string; rows: number }> => {
    const ctx = context as unknown as Ctx;
    await requireRole(ctx, "investigador");
    const { supabase } = ctx;

    // Solo participantes con consentimiento vigente.
    const { data: consents } = await supabase
      .from("research_consent")
      .select("user_id, consent_version, revoked_at, accepted_at")
      .order("accepted_at", { ascending: false });
    const allowed = new Set<string>();
    const seen = new Set<string>();
    for (const c of consents ?? []) {
      if (seen.has(c.user_id)) continue;
      seen.add(c.user_id);
      if (!c.revoked_at && c.consent_version === CONSENT_VERSION) allowed.add(c.user_id);
    }
    const ids = [...allowed];
    const code = (id: string) => participantCode(id);

    if (data.dataset === "resumen") {
      const rows = (await loadStudentRows(ctx, false)).filter((r) => allowed.has(r.userId));
      return {
        filename: "soulsync_resumen.csv",
        rows: rows.length,
        csv: toCsv(
          ["participante", "nivel", "racha", "riesgo", "score", "tendencia", "cobertura", "checkins_14d", "misiones_7d", "omitidas_7d", "adherencia_7d"],
          rows.map((r) => [r.participantCode, r.level, r.streak, r.riskLevel, r.score, r.trend, r.coverage, r.checkins14, r.missions7, r.skipped7, r.adherence7]),
        ),
      };
    }

    if (ids.length === 0) return { filename: `soulsync_${data.dataset}.csv`, csv: "", rows: 0 };

    const table = {
      checkins: "wellbeing_checkins",
      task_events: "task_events",
      missions: "mission_completions",
      predictions: "wellbeing_predictions",
      scales: "wellbeing_scales",
    }[data.dataset];

    const columns = {
      checkins: "user_id, checkin_date, mood, stress, energy, social, sleep_hours",
      task_events: "user_id, occurred_date, mission_id, status, category, duration_seconds, is_ar",
      missions: "user_id, completed_date, mission_id, title, category, xp_earned, is_ar",
      predictions: "user_id, generated_at, model_version, feature_version, score, risk_level, trend, trend_delta, coverage",
      scales: "user_id, scale_code, raw_score, max_score, answered_at",
    }[data.dataset];

    const { data: rows } = await supabase.from(table).select(columns).in("user_id", ids).limit(20000);
    const list = (rows ?? []) as Record<string, unknown>[];
    const headers = columns.split(",").map((c) => c.trim());
    const csv = toCsv(
      headers.map((h) => (h === "user_id" ? "participante" : h)),
      list.map((r) =>
        headers.map((h) => (h === "user_id" ? code(String(r["user_id"])) : (r[h] as string | number | null))),
      ),
    );
    return { filename: `soulsync_${data.dataset}.csv`, csv, rows: list.length };
  });
