-- Modelos versionados y registro de recomendaciones (IA propia de SoulSync).
-- model_versions: qué modelos existen, con qué parámetros y cuál está activo (lectura pública).
-- recommendation_log: qué misiones recomendó el modelo a cada estudiante y si las aceptó,
-- para evaluarlo. Solo se registra con consentimiento; se borra al revocarlo.
CREATE TABLE IF NOT EXISTS public.model_versions (
  version text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('brujula', 'recomendador')),
  description text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.model_versions TO authenticated;
GRANT ALL ON public.model_versions TO service_role;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read model versions" ON public.model_versions FOR SELECT TO authenticated USING (true);

INSERT INTO public.model_versions (version, kind, description, params, active) VALUES
  ('decision-v4', 'brujula', 'Criterio de decisión v4 sobre el baseline logístico v3: pesos expertos, línea base personal, factores protectores, calendario académico, reglas de seguridad e histéresis.', '{"baseline": "baseline-logistic-v3"}'::jsonb, true),
  ('thompson-v1', 'recomendador', 'Muestreo de Thompson Beta-Bernoulli por categoría de misión. Recompensa: el check-in siguiente (hasta 2 días) mejora o se mantiene alto. Prior: Beta(2,1) en categorías afines al arquetipo, Beta(1,1) en las demás.', '{"window_days": 90, "outcome_window_days": 2, "prior_affine": [2, 1], "prior": [1, 1], "recommendations_per_day": 3}'::jsonb, true)
ON CONFLICT (version) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.recommendation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  rec_date date NOT NULL,
  mission_id text NOT NULL,
  category text NOT NULL,
  rank smallint NOT NULL,
  score numeric NOT NULL,
  model_version text NOT NULL,
  shown_at timestamptz NOT NULL DEFAULT now(),
  taken_at timestamptz,
  CONSTRAINT recommendation_log_once UNIQUE (user_id, rec_date, mission_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_log TO authenticated;
GRANT ALL ON public.recommendation_log TO service_role;
ALTER TABLE public.recommendation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own recommendations" ON public.recommendation_log FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users insert own recommendations" ON public.recommendation_log FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "users update own recommendations" ON public.recommendation_log FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "users delete own recommendations" ON public.recommendation_log FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "admins read all recommendation_log" ON public.recommendation_log FOR SELECT TO authenticated
  USING ((SELECT public.is_admin((SELECT auth.uid()))));
CREATE INDEX IF NOT EXISTS recommendation_log_date_idx ON public.recommendation_log (rec_date);
