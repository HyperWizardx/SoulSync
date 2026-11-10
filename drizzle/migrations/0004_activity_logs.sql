-- Registro de actividad física (meta semanal de la OMS: 150 min moderados o equivalente).
-- Idempotente: se puede ejecutar de nuevo sin error (tablas IF NOT EXISTS, políticas recreadas).
-- Cada estudiante ve y registra solo lo suyo; el equipo de investigación puede leerlo.
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  activity_date date NOT NULL,
  minutes integer NOT NULL CHECK (minutes > 0 AND minutes <= 600),
  intensity text NOT NULL CHECK (intensity IN ('moderada', 'vigorosa')),
  strength boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own activity" ON public.activity_logs;
CREATE POLICY "users read own activity" ON public.activity_logs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users insert own activity" ON public.activity_logs;
CREATE POLICY "users insert own activity" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users delete own activity" ON public.activity_logs;
CREATE POLICY "users delete own activity" ON public.activity_logs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "admins read all activity_logs" ON public.activity_logs;
CREATE POLICY "admins read all activity_logs" ON public.activity_logs FOR SELECT TO authenticated
  USING ((SELECT public.is_admin((SELECT auth.uid()))));

CREATE INDEX IF NOT EXISTS activity_logs_user_date_idx ON public.activity_logs (user_id, activity_date DESC);
