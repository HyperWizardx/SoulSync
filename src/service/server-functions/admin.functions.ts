/** Servicio del panel: autentica, valida entradas y compone los casos de uso. */
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { buildAdminDeps } from '@/infrastructure/persistence/supabase/adminRepository';
import { getAdminAccessUseCase, listStudentsUseCase, getPopulationMetricsUseCase, getStudentDetailUseCase, exportDatasetUseCase } from '@/application/research/useCases';
import { DATASETS } from '@/domain/research/ports';
export { DATASETS } from '@/domain/research/ports';
export type { AdminAccess, StudentDetail, DatasetKey } from '@/domain/research/ports';
export type { StudentRow, PopulationMetrics } from '@/domain/research/aggregate';

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

