-- Votos "¿Te sirvió?" al terminar una misión (fase IA interactiva).
-- Idempotente: se puede ejecutar de nuevo sin error.
-- mission_feedback: un voto por estudiante, misión y día (se puede cambiar). Alimenta al
-- recomendador propio (muestreo de Thompson) como observación directa de la categoría. Lo lee
-- su dueño y el rol de investigación (para medir el recomendador); no contiene texto libre.
CREATE TABLE IF NOT EXISTS public.mission_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id text NOT NULL,
  category text NOT NULL,
  helpful boolean NOT NULL,
  feedback_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id, feedback_date)
);
CREATE INDEX IF NOT EXISTS mission_feedback_user_date_idx ON public.mission_feedback (user_id, feedback_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_feedback TO authenticated;
GRANT ALL ON public.mission_feedback TO service_role;
ALTER TABLE public.mission_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own mission feedback" ON public.mission_feedback;
CREATE POLICY "users read own mission feedback" ON public.mission_feedback FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users insert own mission feedback" ON public.mission_feedback;
CREATE POLICY "users insert own mission feedback" ON public.mission_feedback FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users update own mission feedback" ON public.mission_feedback;
CREATE POLICY "users update own mission feedback" ON public.mission_feedback FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users delete own mission feedback" ON public.mission_feedback;
CREATE POLICY "users delete own mission feedback" ON public.mission_feedback FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "researchers read mission feedback" ON public.mission_feedback;
CREATE POLICY "researchers read mission feedback" ON public.mission_feedback FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'investigador')));
