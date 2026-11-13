-- SoulSync · Migración 0009 (respuestas de misiones para el panel de psicología).
-- Uso: Lovable → Cloud → Database → SQL editor: pega todo y pulsa Run. Idempotente, en una transacción.
BEGIN;

-- Respuestas de las misiones para la trazabilidad del acompañamiento psicológico.
-- Idempotente: se puede ejecutar de nuevo sin error.
-- research_consent.share_writing: el estudiante autoriza (opcional) que psicología lea sus escritos.
-- mission_responses: opción elegida en cada pregunta de los quiz, pasos marcados, reto del día y,
-- solo con autorización, lo que escribió (diario, gratitud, cartas). La ve su dueño y el rol de
-- psicología (no investigación: no se exporta texto libre). Se borra al revocar el consentimiento.
ALTER TABLE public.research_consent ADD COLUMN IF NOT EXISTS share_writing boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.mission_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id text NOT NULL,
  mission_title text NOT NULL,
  category text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('quiz', 'texto', 'gratitud', 'pasos', 'reto')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  shared_writing boolean NOT NULL DEFAULT false,
  completed_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mission_responses_user_created_idx ON public.mission_responses (user_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.mission_responses TO authenticated;
GRANT ALL ON public.mission_responses TO service_role;
ALTER TABLE public.mission_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own mission responses" ON public.mission_responses;
CREATE POLICY "users read own mission responses" ON public.mission_responses FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users insert own mission responses" ON public.mission_responses;
CREATE POLICY "users insert own mission responses" ON public.mission_responses FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users delete own mission responses" ON public.mission_responses;
CREATE POLICY "users delete own mission responses" ON public.mission_responses FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "psychologists read mission responses" ON public.mission_responses;
CREATE POLICY "psychologists read mission responses" ON public.mission_responses FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'psicologo')));

COMMIT;
