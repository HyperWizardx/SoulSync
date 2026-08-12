-- 1) task_events
CREATE TABLE public.task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id text NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'autocuidado',
  status text NOT NULL CHECK (status IN ('assigned','started','completed','skipped')),
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  is_ar boolean NOT NULL DEFAULT false,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  occurred_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.task_events TO authenticated;
GRANT ALL ON public.task_events TO service_role;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own task events" ON public.task_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own task events" ON public.task_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own task events" ON public.task_events FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX task_events_user_time_idx ON public.task_events (user_id, occurred_at DESC);
CREATE INDEX task_events_user_date_idx ON public.task_events (user_id, occurred_date);

-- 2) timeline_events
CREATE TABLE public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('checkin','task_completed','task_skipped','prediction_change','milestone','world_change')),
  title text NOT NULL,
  detail text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own timeline" ON public.timeline_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own timeline" ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own timeline" ON public.timeline_events FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX timeline_events_user_time_idx ON public.timeline_events (user_id, occurred_at DESC);

-- 3) world_state
CREATE TABLE public.world_state (
  user_id uuid PRIMARY KEY,
  vitality integer NOT NULL DEFAULT 50 CHECK (vitality BETWEEN 0 AND 100),
  harmony integer NOT NULL DEFAULT 50 CHECK (harmony BETWEEN 0 AND 100),
  zones_unlocked integer NOT NULL DEFAULT 1 CHECK (zones_unlocked >= 0),
  tasks_today integer NOT NULL DEFAULT 0 CHECK (tasks_today >= 0),
  season text NOT NULL DEFAULT 'calma',
  recomputed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.world_state TO authenticated;
GRANT ALL ON public.world_state TO service_role;
ALTER TABLE public.world_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own world" ON public.world_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own world" ON public.world_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own world" ON public.world_state FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER world_state_touch BEFORE UPDATE ON public.world_state FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) predicción: tendencia esperada
ALTER TABLE public.wellbeing_predictions
  ADD COLUMN IF NOT EXISTS trend text NOT NULL DEFAULT 'estable',
  ADD COLUMN IF NOT EXISTS trend_delta numeric NOT NULL DEFAULT 0;