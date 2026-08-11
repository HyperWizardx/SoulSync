-- 1. Check-ins
CREATE TABLE public.wellbeing_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  mood smallint NOT NULL,
  stress smallint NOT NULL,
  energy smallint NOT NULL,
  social smallint NOT NULL,
  sleep_hours numeric(3,1),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wellbeing_checkins_user_date_key UNIQUE (user_id, checkin_date),
  CONSTRAINT wellbeing_checkins_mood_chk CHECK (mood BETWEEN 1 AND 5),
  CONSTRAINT wellbeing_checkins_stress_chk CHECK (stress BETWEEN 1 AND 5),
  CONSTRAINT wellbeing_checkins_energy_chk CHECK (energy BETWEEN 1 AND 5),
  CONSTRAINT wellbeing_checkins_social_chk CHECK (social BETWEEN 1 AND 5),
  CONSTRAINT wellbeing_checkins_sleep_chk CHECK (sleep_hours IS NULL OR (sleep_hours >= 0 AND sleep_hours <= 24)),
  CONSTRAINT wellbeing_checkins_note_chk CHECK (note IS NULL OR char_length(note) <= 280)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wellbeing_checkins TO authenticated;
GRANT ALL ON public.wellbeing_checkins TO service_role;
ALTER TABLE public.wellbeing_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own checkins" ON public.wellbeing_checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own checkins" ON public.wellbeing_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own checkins" ON public.wellbeing_checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own checkins" ON public.wellbeing_checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX wellbeing_checkins_user_date_idx ON public.wellbeing_checkins (user_id, checkin_date DESC);
CREATE TRIGGER wellbeing_checkins_touch BEFORE UPDATE ON public.wellbeing_checkins FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Escalas validadas (opcional, habilitadas por el investigador)
CREATE TABLE public.wellbeing_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scale_code text NOT NULL,
  raw_score numeric NOT NULL,
  max_score numeric NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wellbeing_scales_score_chk CHECK (raw_score >= 0 AND max_score > 0 AND raw_score <= max_score)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wellbeing_scales TO authenticated;
GRANT ALL ON public.wellbeing_scales TO service_role;
ALTER TABLE public.wellbeing_scales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own scales" ON public.wellbeing_scales FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own scales" ON public.wellbeing_scales FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own scales" ON public.wellbeing_scales FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own scales" ON public.wellbeing_scales FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX wellbeing_scales_user_idx ON public.wellbeing_scales (user_id, answered_at DESC);

-- 3. Predicciones
CREATE TABLE public.wellbeing_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  model_version text NOT NULL,
  feature_version text NOT NULL,
  score numeric(5,4),
  risk_level text NOT NULL,
  coverage numeric(4,3) NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanation jsonb NOT NULL DEFAULT '[]'::jsonb,
  consent_version text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wellbeing_predictions_risk_chk CHECK (risk_level IN ('bajo','moderado','alto','insuficiente')),
  CONSTRAINT wellbeing_predictions_score_chk CHECK (score IS NULL OR (score >= 0 AND score <= 1))
);
GRANT SELECT, INSERT, DELETE ON public.wellbeing_predictions TO authenticated;
GRANT ALL ON public.wellbeing_predictions TO service_role;
ALTER TABLE public.wellbeing_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own predictions" ON public.wellbeing_predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own predictions" ON public.wellbeing_predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own predictions" ON public.wellbeing_predictions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX wellbeing_predictions_user_idx ON public.wellbeing_predictions (user_id, generated_at DESC);

-- 4. Consentimiento informado
CREATE TABLE public.research_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  wearables_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT research_consent_user_version_key UNIQUE (user_id, consent_version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_consent TO authenticated;
GRANT ALL ON public.research_consent TO service_role;
ALTER TABLE public.research_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own consent" ON public.research_consent FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own consent" ON public.research_consent FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own consent" ON public.research_consent FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own consent" ON public.research_consent FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER research_consent_touch BEFORE UPDATE ON public.research_consent FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();