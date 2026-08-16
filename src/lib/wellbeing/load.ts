import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { CONSENT_VERSION } from "./types";
import type {
  CheckinRecord,
  PredictionInput,
  TaskCategory,
  TaskEventRecord,
  TaskStatus,
  WellbeingPrediction,
} from "./types";
import { extractFeatures, serializeFeatures } from "./features";
import { activeModel } from "./inference";
import { deriveWorldState } from "./world";
import type { WorldState } from "./world";

export type ConsentState = {
  accepted: boolean;
  consentVersion: string | null;
  acceptedAt: string | null;
  wearablesOptIn: boolean;
  currentVersion: string;
};

export type TimelineEntry = {
  id: string;
  kind: "checkin" | "task_completed" | "task_skipped" | "prediction_change" | "milestone" | "world_change";
  title: string;
  detail: string | null;
  occurredAt: string;
};

export type WellbeingPayload = {
  consent: ConsentState;
  todayCheckin: CheckinRecord | null;
  checkins: CheckinRecord[];
  prediction: WellbeingPrediction | null;
  world: WorldState | null;
  timeline: TimelineEntry[];
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

type Db = SupabaseClient<Database>;

export async function assertConsent(supabase: Db, userId: string) {
  const { data } = await supabase
    .from("research_consent")
    .select("consent_version, revoked_at")
    .eq("user_id", userId)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data || data.revoked_at || data.consent_version !== CONSENT_VERSION) {
    throw new Error("Consentimiento requerido antes de registrar check-ins.");
  }
}

/**
 * Igual que assertConsent pero sin lanzar: para rutas donde la telemetría
 * es un efecto secundario opcional (p. ej. completar/omitir una misión) y
 * no debe romper el flujo principal si el usuario no ha consentido.
 */
export async function hasActiveConsent(supabase: Db, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("research_consent")
    .select("consent_version, revoked_at")
    .eq("user_id", userId)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Boolean(data && !data.revoked_at && data.consent_version === CONSENT_VERSION);
}

/** Registro en la historia unificada. No almacena texto libre del usuario. */
export async function addTimelineEvent(
  supabase: Db,
  userId: string,
  entry: {
    kind: TimelineEntry["kind"];
    title: string;
    detail?: string | null;
    payload?: Record<string, unknown>;
  },
) {
  await supabase.from("timeline_events").insert({
    user_id: userId,
    kind: entry.kind,
    title: entry.title,
    detail: entry.detail ?? null,
    payload: (entry.payload ?? {}) as unknown as Json,
  });
}

/**
 * Carga el estado del módulo de bienestar y ejecuta la inferencia.
 * Solo se llama desde server functions autenticadas.
 */
export async function loadWellbeing(supabase: Db, userId: string): Promise<WellbeingPayload> {
  const today = todayISO();
  const since = new Date(Date.now() - 13 * 86_400_000).toISOString().slice(0, 10);
  const sinceTelemetry = new Date(Date.now() - 13 * 86_400_000).toISOString();

  const [consentRes, checkinRes, profileRes, missionRes, scaleRes, taskRes, timelineRes] =
    await Promise.all([
      supabase
        .from("research_consent")
        .select("consent_version, accepted_at, revoked_at, wearables_opt_in")
        .eq("user_id", userId)
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("wellbeing_checkins")
        .select("checkin_date, mood, stress, energy, social, sleep_hours")
        .eq("user_id", userId)
        .gte("checkin_date", since)
        .order("checkin_date", { ascending: false }),
      supabase
        .from("profiles")
        .select("daily_goal, last_mission_date, streak, level")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("mission_completions")
        .select("completed_date")
        .eq("user_id", userId)
        .gte("completed_at", sinceTelemetry),
      supabase
        .from("wellbeing_scales")
        .select("scale_code, raw_score, max_score, answered_at")
        .eq("user_id", userId)
        .order("answered_at", { ascending: false })
        .limit(5),
      supabase
        .from("task_events")
        .select("occurred_date, mission_id, status, category, duration_seconds")
        .eq("user_id", userId)
        .gte("occurred_date", since),
      supabase
        .from("timeline_events")
        .select("id, kind, title, detail, occurred_at")
        .eq("user_id", userId)
        .order("occurred_at", { ascending: false })
        .limit(40),
    ]);

  const consentRow = consentRes.data;
  const consent: ConsentState = {
    accepted: Boolean(consentRow && !consentRow.revoked_at && consentRow.consent_version === CONSENT_VERSION),
    consentVersion: consentRow?.consent_version ?? null,
    acceptedAt: consentRow?.accepted_at ?? null,
    wearablesOptIn: Boolean(consentRow?.wearables_opt_in),
    currentVersion: CONSENT_VERSION,
  };

  const checkins: CheckinRecord[] = (checkinRes.data ?? []).map((c) => ({
    date: c.checkin_date as string,
    mood: c.mood as number,
    stress: c.stress as number,
    energy: c.energy as number,
    social: c.social as number,
    sleepHours: c.sleep_hours === null ? null : Number(c.sleep_hours),
  }));

  const todayCheckin = checkins.find((c) => c.date === today) ?? null;

  const timeline: TimelineEntry[] = (timelineRes.data ?? []).map((t) => ({
    id: t.id as string,
    kind: t.kind as TimelineEntry["kind"],
    title: t.title as string,
    detail: (t.detail as string | null) ?? null,
    occurredAt: t.occurred_at as string,
  }));

  if (!consent.accepted) {
    return { consent, todayCheckin, checkins, prediction: null, world: null, timeline };
  }

  const missionsByDate: Record<string, number> = {};
  for (const m of missionRes.data ?? []) {
    const d = m.completed_date as string;
    missionsByDate[d] = (missionsByDate[d] ?? 0) + 1;
  }

  const taskEvents: TaskEventRecord[] = (taskRes.data ?? []).map((t) => ({
    date: t.occurred_date as string,
    missionId: t.mission_id as string,
    status: t.status as TaskStatus,
    category: t.category as TaskCategory,
    durationSeconds: Number(t.duration_seconds ?? 0),
  }));

  const dailyGoal = profileRes.data?.daily_goal ?? 3;

  const input: PredictionInput = {
    today,
    checkins,
    telemetry: {
      missionsByDate,
      dailyGoal,
      lastMissionDate: profileRes.data?.last_mission_date ?? null,
    },
    scales: (scaleRes.data ?? []).map((s) => ({
      code: s.scale_code as string,
      raw: Number(s.raw_score),
      max: Number(s.max_score),
      answeredAt: String(s.answered_at).slice(0, 10),
    })),
    taskEvents,
  };

  const featureSet = extractFeatures(input);
  const prediction = activeModel.predict(featureSet);

  const tasksToday = missionsByDate[today] ?? 0;
  const tasksLast7 = Object.entries(missionsByDate).reduce((sum, [date, count]) => {
    const diff = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000;
    return diff >= 0 && diff < 7 ? sum + count : sum;
  }, 0);

  const world = deriveWorldState({
    tasksToday,
    dailyGoal,
    tasksLast7,
    streak: profileRes.data?.streak ?? 0,
    level: profileRes.data?.level ?? 1,
    checkinToday: Boolean(todayCheckin),
    wellbeingIndex7: featureSet.wellbeingIndex7,
    trend: prediction.trend,
    riskLevel: prediction.riskLevel,
  });

  await supabase.from("world_state").upsert(
    {
      user_id: userId,
      vitality: world.vitality,
      harmony: world.harmony,
      zones_unlocked: world.zonesUnlocked,
      tasks_today: world.tasksToday,
      season: world.season,
      recomputed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  // Trazabilidad: se persiste como máximo una predicción por día y se registra
  // en la historia unificada cuando la señal o la tendencia cambian.
  if (prediction.riskLevel !== "insuficiente") {
    const { data: last } = await supabase
      .from("wellbeing_predictions")
      .select("generated_at, risk_level, trend")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastDay = last?.generated_at ? String(last.generated_at).slice(0, 10) : null;
    if (lastDay !== today) {
      await supabase.from("wellbeing_predictions").insert({
        user_id: userId,
        model_version: prediction.modelVersion,
        feature_version: prediction.featureVersion,
        score: prediction.score,
        risk_level: prediction.riskLevel,
        coverage: prediction.coverage,
        trend: prediction.trend,
        trend_delta: prediction.trendDelta,
        features: serializeFeatures(featureSet) as unknown as Json,
        explanation: prediction.explanation as unknown as Json,
        consent_version: CONSENT_VERSION,
        generated_at: prediction.generatedAt,
      });

      const changed = last && (last.risk_level !== prediction.riskLevel || last.trend !== prediction.trend);
      if (changed) {
        const top = prediction.explanation.slice(0, 2).map((f) => f.label).join(" · ");
        await addTimelineEvent(supabase, userId, {
          kind: "prediction_change",
          title: `Señal ${prediction.riskLevel} · tendencia ${prediction.trend}`,
          detail: top ? `Coincide con: ${top}` : null,
          payload: {
            riskLevel: prediction.riskLevel,
            previousRiskLevel: last?.risk_level ?? null,
            trend: prediction.trend,
            score: prediction.score,
            modelVersion: prediction.modelVersion,
            featureVersion: prediction.featureVersion,
          },
        });
        timeline.unshift({
          id: `local-${prediction.generatedAt}`,
          kind: "prediction_change",
          title: `Señal ${prediction.riskLevel} · tendencia ${prediction.trend}`,
          detail: top ? `Coincide con: ${top}` : null,
          occurredAt: prediction.generatedAt,
        });
      }
    }
  }

  return { consent, todayCheckin, checkins, prediction, world, timeline };
}
