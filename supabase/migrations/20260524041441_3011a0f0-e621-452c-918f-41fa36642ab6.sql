ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_goal integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS text_size text NOT NULL DEFAULT 'normal';

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS achievements_user_idx ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS mission_completions_user_date_idx
  ON public.mission_completions(user_id, completed_date);