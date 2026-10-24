/** Adaptador de lectura del panel: consultas autenticadas y traducción de datos persistidos. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { DATASET_COLUMNS, type AdminRepository } from '@/domain/research/ports';
import type { CheckinRecord } from '@/domain/wellbeing/types';

// El cliente privilegiado se suministra desde el handler y solo se solicita tras comprobar el rol.
export function buildAdminDeps(supabase: SupabaseClient<Database>, getIdentityClient: () => Promise<SupabaseClient<Database>>) {
  const repository: AdminRepository = {
    async readAccess(userId) {
      const [p, i] = await Promise.all([
        supabase.rpc('has_role', { _user_id: userId, _role: 'psicologo' }),
        supabase.rpc('has_role', { _user_id: userId, _role: 'investigador' }),
      ]);
      if (p.error || i.error) throw new Error('No se pudieron verificar los permisos de administración.');
      const psicologo = Boolean(p.data);
      const investigador = Boolean(i.data);
      return { psicologo, investigador, isAdmin: psicologo || investigador };
    },
    async loadStudents(withEmails, since, sinceTs) {
  const [profiles, consents, checkins, missions, tasks] = await Promise.all([
    supabase.from("profiles").select("user_id, name, level, streak, archetype, daily_goal, last_mission_date"),
    supabase.from("research_consent").select("user_id, consent_version, revoked_at, accepted_at").order("accepted_at", { ascending: false }),
    supabase.from("wellbeing_checkins").select("user_id, checkin_date, mood, stress, energy, social, sleep_hours, checkin_local_hour, response_seconds").gte("checkin_date", since),
    supabase.from("mission_completions").select("user_id, completed_date, completed_at").gte("completed_at", sinceTs),
    supabase.from("task_events").select("user_id, occurred_date, mission_id, status, category, duration_seconds").gte("occurred_date", since),
  ]);

  const emails = new Map<string, string>();
  if (withEmails) {
    const supabaseAdmin = await getIdentityClient();
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) if (u.email) emails.set(u.id, u.email);
  }


      return { profiles: profiles.data ?? [], consents: consents.data ?? [], checkins: checkins.data ?? [], missions: missions.data ?? [], tasks: tasks.data ?? [], emails };
    },
    async loadDetail(uid, since30) {
    const [checkinRes, predRes, missionRes, taskRes, timelineRes, scaleRes, worldRes, statRes, attrRes] =
      await Promise.all([
        supabase.from("wellbeing_checkins").select("checkin_date, mood, stress, energy, social, sleep_hours, checkin_local_hour, response_seconds").eq("user_id", uid).gte("checkin_date", since30).order("checkin_date", { ascending: true }),
        supabase.from("wellbeing_predictions").select("generated_at, risk_level, trend, score, coverage").eq("user_id", uid).order("generated_at", { ascending: false }).limit(30),
        supabase.from("mission_completions").select("title, completed_at, xp_earned, is_ar, category").eq("user_id", uid).order("completed_at", { ascending: false }).limit(40),
        supabase.from("task_events").select("status, category").eq("user_id", uid).gte("occurred_date", since30),
        supabase.from("timeline_events").select("id, kind, title, detail, occurred_at").eq("user_id", uid).order("occurred_at", { ascending: false }).limit(40),
        supabase.from("wellbeing_scales").select("scale_code, raw_score, max_score, answered_at").eq("user_id", uid).order("answered_at", { ascending: false }).limit(10),
        supabase.from("world_state").select("vitality, harmony, zones_unlocked, season").eq("user_id", uid).maybeSingle(),
        supabase.from("user_stats").select("bienestar, resiliencia, energia, claridad").eq("user_id", uid).maybeSingle(),
        supabase.from("user_attributes").select("*").eq("user_id", uid).maybeSingle(),
      ]);

    const checkins: CheckinRecord[] = (checkinRes.data ?? []).map((c: any) => ({
      date: c.checkin_date,
      mood: c.mood,
      stress: c.stress,
      energy: c.energy,
      social: c.social,
      sleepHours: c.sleep_hours === null ? null : Number(c.sleep_hours),
      localHour: c.checkin_local_hour ?? null,
      responseSeconds: c.response_seconds ?? null,
    }));

    const { user_id: _omit, updated_at: _omit2, ...attrs } = (attrRes.data ?? {}) as Record<string, any>;

    return {
      checkins,
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
      tasks: taskRes.data ?? [],
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
  },

    async loadConsents() {
      const { data, error } = await supabase.from('research_consent').select('user_id, consent_version, revoked_at, accepted_at').order('accepted_at', { ascending: false });
      if (error) throw new Error('No se pudo consultar el consentimiento.');
      return data ?? [];
    },
    async loadDataset(dataset, ids) {
      const tables = { checkins: 'wellbeing_checkins', task_events: 'task_events', missions: 'mission_completions', predictions: 'wellbeing_predictions', scales: 'wellbeing_scales' } as const;
      const { data, error } = await supabase.from(tables[dataset]).select(DATASET_COLUMNS[dataset]).in('user_id', ids).limit(20000);
      if (error) throw new Error('No se pudo exportar el conjunto de datos.');
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
  };
  return { repository, now: () => new Date() };
}
