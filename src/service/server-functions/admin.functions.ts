/** Servicio del panel: autentica, valida entradas y compone los casos de uso. */
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { buildAdminDeps } from '@/infrastructure/persistence/supabase/adminRepository';
import { getAdminAccessUseCase, listStudentsUseCase, getPopulationMetricsUseCase, getStudentDetailUseCase, exportDatasetUseCase, getPsychologistDashboardUseCase, addFollowUpUseCase, addCalendarPeriodUseCase, removeCalendarPeriodUseCase } from '@/application/research/useCases';
import { DATASETS } from '@/domain/research/ports';
import { summarizeRecommendations } from '@/domain/wellbeing/recommender';
import { activateCompassUseCase, getModelLabUseCase, trainCompassUseCase } from '@/application/research/modelLab';
export type { CompassReport, ModelLab } from '@/application/research/modelLab';
export type { ProfilesReport, GroupProfile } from '@/domain/research/clustering';
export type { ForecastBacktest } from '@/domain/wellbeing/forecast';
export { DATASETS } from '@/domain/research/ports';
export type { AdminAccess, StudentDetail, DatasetKey } from '@/domain/research/ports';
export type { StudentRow, PopulationMetrics } from '@/domain/research/aggregate';
export type { StudentAlert, AlertPriority } from '@/domain/research/alerts';
export type { DashboardSeries } from '@/domain/research/dashboard';

export const getAdminAccess = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const deps = buildAdminDeps(context.supabase, async () => {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      return supabaseAdmin;
    });
    return getAdminAccessUseCase(deps, context.userId);
  });

export const listStudents = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const deps = buildAdminDeps(context.supabase, async () => {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      return supabaseAdmin;
    });
    return listStudentsUseCase(deps, context.userId);
  });

export const getPopulationMetrics = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const deps = buildAdminDeps(context.supabase, async () => {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      return supabaseAdmin;
    });
    return getPopulationMetricsUseCase(deps, context.userId);
  });

export const getStudentDetail = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const deps = buildAdminDeps(context.supabase, async () => {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      return supabaseAdmin;
    });
    return getStudentDetailUseCase(deps, context.userId, data.userId);
  });

export const exportDataset = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dataset: z.enum(DATASETS) }).parse(d))
  .handler(async ({ context, data }) => {
    const deps = buildAdminDeps(context.supabase, async () => {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      return supabaseAdmin;
    });
    return exportDatasetUseCase(deps, context.userId, data.dataset);
  });


const adminDeps = (supabase: Parameters<typeof buildAdminDeps>[0]) => buildAdminDeps(supabase, async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin;
});

export const getPsychologistDashboard = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getPsychologistDashboardUseCase(adminDeps(context.supabase), context.userId));

export const addFollowUp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ studentId: z.string().uuid(), note: z.string().max(1000) }).parse(d))
  .handler(async ({ context, data }) => { await addFollowUpUseCase(adminDeps(context.supabase), context.userId, data.studentId, data.note); return { ok: true }; });

export const addCalendarPeriod = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ label: z.string().trim().min(1).max(80), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ context, data }) => { await addCalendarPeriodUseCase(adminDeps(context.supabase), context.userId, data); return { ok: true }; });

export const removeCalendarPeriod = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => { await removeCalendarPeriodUseCase(adminDeps(context.supabase), context.userId, data.id); return { ok: true }; });

/** Modelos de IA: versiones registradas y aceptación del recomendador (30 días). Solo equipo. */
export const getModelsReport = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await getAdminAccessUseCase(adminDeps(context.supabase), context.userId);
    if (!access.isAdmin) throw new Error('Acceso restringido al equipo de investigación.');
    const since = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
    const [models, recs] = await Promise.all([
      context.supabase.from('model_versions').select('version, kind, description, active, created_at').order('created_at', { ascending: false }),
      context.supabase.from('recommendation_log').select('category, taken_at').gte('rec_date', since).limit(20000),
    ]);
    return {
      models: (models.data ?? []).map((m) => ({ version: m.version, kind: m.kind, description: m.description, active: m.active })),
      recommender: summarizeRecommendations((recs.data ?? []).map((r) => ({ category: r.category, taken: r.taken_at !== null }))),
    };
  });

/** Laboratorio de modelos (investigación): brújulas entrenadas, pronóstico y perfiles. */
export const getModelLab = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getModelLabUseCase(adminDeps(context.supabase), context.userId));

/** Entrena una nueva brújula con los datos actuales y la registra inactiva. */
export const trainCompass = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => trainCompassUseCase(adminDeps(context.supabase), context.userId));

/** Activa una brújula que superó la compuerta, o vuelve al criterio experto (decision-v4). */
export const activateCompass = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ version: z.string().regex(/^(decision-v4|brujula-map-\d{8}-\d{4})$/) }).parse(d))
  .handler(async ({ context, data }) => { await activateCompassUseCase(adminDeps(context.supabase), context.userId, data.version); return { ok: true }; });
