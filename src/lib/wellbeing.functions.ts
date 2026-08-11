import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONSENT_VERSION } from "@/lib/wellbeing/types";
import type { CheckinRecord, PredictionInput, WellbeingPrediction } from "@/lib/wellbeing/types";
import { extractFeatures, serializeFeatures } from "@/lib/wellbeing/features";
import { activeModel } from "@/lib/wellbeing/inference";

export type ConsentState = {
  accepted: boolean;
  consentVersion: string | null;
  acceptedAt: string | null;
  wearablesOptIn: boolean;
  currentVersion: string;
};

export type WellbeingPayload = {
  consent: ConsentState;
  todayCheckin: CheckinRecord | null;
  checkins: CheckinRecord[];
  prediction: WellbeingPrediction | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

async function loadWellbeing(
  supabase: any,
  userId: string,
): Promise<WellbeingPayload> {
  const today = todayISO();
  const since = new Date(Date.now() - 13 * 86_400_000).toISOString().slice(0, 10);
  const sinceTelemetry = new Date(Date.now() - 13 * 86_400_000).toISOString();

  const [consentRes, checkinRes, profileRes, missionRes, scaleRes] = await Promise.all([
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
    supabase.from("profiles").select("daily_goal, last_mission_date").eq("user_id", userId).maybeSingle(),
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
  ]);

  const consentRow = consentRes.data;
  const consent: ConsentState = {
    accepted: Boolean(consentRow && !consentRow.revoked_at && consentRow.consent_version === CONSENT_VERSION),
    consentVersion: consentRow?.consent_version ?? null,
    acceptedAt: consentRow?.accepted_at ?? null,
    wearablesOptIn: Boolean(consentRow?.wearables_opt_in),
    currentVersion: CONSENT_VERSION,
  };

  const checkins: CheckinRecord[] = (checkinRes.data ?? []).map((c: any) => ({
    date: c.checkin_date as string,
    mood: c.mood as number,
    stress: c.stress as number,
    energy: c.energy as number,
    social: c.social as number,
    sleepHours: c.sleep_hours === null ? null : Number(c.sleep_hours),
  }));

  if (!consent.accepted) {
    return { consent, todayCheckin: checkins.find((c) => c.date === today) ?? null, checkins, prediction: null };
  }

  const missionsByDate: Record<string, number> = {};
  for (const m of missionRes.data ?? []) {
    const d = m.completed_date as string;
    missionsByDate[d] = (missionsByDate[d] ?? 0) + 1;
  }

  const input: PredictionInput = {
    today,
    checkins,
    telemetry: {
      missionsByDate,
      dailyGoal: profileRes.data?.daily_goal ?? 3,
      lastMissionDate: profileRes.data?.last_mission_date ?? null,
    },
    scales: (scaleRes.data ?? []).map((s: any) => ({
      code: s.scale_code as string,
      raw: Number(s.raw_score),
      max: Number(s.max_score),
      answeredAt: String(s.answered_at).slice(0, 10),
    })),
  };

  const featureSet = extractFeatures(input);
  const prediction = activeModel.predict(featureSet);

  // Trazabilidad: se guarda una predicción por día como máximo.
  if (prediction.riskLevel !== "insuficiente") {
    const { data: last } = await supabase
      .from("wellbeing_predictions")
      .select("generated_at")
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
        features: serializeFeatures(featureSet),
        explanation: prediction.explanation,
        consent_version: CONSENT_VERSION,
        generated_at: prediction.generatedAt,
      });
    }
  }

  return { consent, todayCheckin: checkins.find((c) => c.date === today) ?? null, checkins, prediction };
}

export const getWellbeing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WellbeingPayload> => {
    return loadWellbeing(context.supabase, context.userId);
  });

export const setResearchConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ accepted: z.boolean(), wearablesOptIn: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<WellbeingPayload> => {
    const { supabase, userId } = context;
    if (data.accepted) {
      await supabase.from("research_consent").insert({
        user_id: userId,
        consent_version: CONSENT_VERSION,
        wearables_opt_in: data.wearablesOptIn ?? false,
      });
    } else {
      await supabase
        .from("research_consent")
        .update({ revoked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("revoked_at", null);
      // Minimización: al revocar se eliminan los datos del módulo predictivo.
      await supabase.from("wellbeing_predictions").delete().eq("user_id", userId);
      await supabase.from("wellbeing_checkins").delete().eq("user_id", userId);
      await supabase.from("wellbeing_scales").delete().eq("user_id", userId);
    }
    return loadWellbeing(supabase, userId);
  });

export const saveCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        mood: z.number().int().min(1).max(5),
        stress: z.number().int().min(1).max(5),
        energy: z.number().int().min(1).max(5),
        social: z.number().int().min(1).max(5),
        sleepHours: z.number().min(0).max(24).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<WellbeingPayload> => {
    const { supabase, userId } = context;
    const { data: consentRow } = await supabase
      .from("research_consent")
      .select("consent_version, revoked_at")
      .eq("user_id", userId)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!consentRow || consentRow.revoked_at || consentRow.consent_version !== CONSENT_VERSION) {
      throw new Error("Consentimiento requerido antes de registrar check-ins.");
    }

    await supabase.from("wellbeing_checkins").upsert(
      {
        user_id: userId,
        checkin_date: todayISO(),
        mood: data.mood,
        stress: data.stress,
        energy: data.energy,
        social: data.social,
        sleep_hours: data.sleepHours ?? null,
      },
      { onConflict: "user_id,checkin_date" },
    );

    return loadWellbeing(supabase, userId);
  });
