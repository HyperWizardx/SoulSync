-- Índices de rendimiento para las consultas reales de la app (ver infrastructure/persistence/supabase).
-- Solo agrega índices; no cambia datos ni políticas.

-- Historial del jugador: últimas 50 misiones ordenadas por fecha y telemetría por rango de tiempo.
CREATE INDEX IF NOT EXISTS mission_completions_user_completed_at_idx
  ON public.mission_completions (user_id, completed_at DESC);

-- Panel del psicólogo: actividad poblacional por rango de fechas (sin filtrar por usuario).
CREATE INDEX IF NOT EXISTS mission_completions_completed_at_idx
  ON public.mission_completions (completed_at);
CREATE INDEX IF NOT EXISTS wellbeing_checkins_date_idx
  ON public.wellbeing_checkins (checkin_date);
CREATE INDEX IF NOT EXISTS task_events_date_idx
  ON public.task_events (occurred_date);
CREATE INDEX IF NOT EXISTS wellbeing_predictions_generated_at_idx
  ON public.wellbeing_predictions (generated_at);

-- Consentimiento vigente: se consulta en cada carga del módulo de bienestar.
CREATE INDEX IF NOT EXISTS research_consent_user_accepted_idx
  ON public.research_consent (user_id, accepted_at DESC);

-- Hitos del historial (kind = 'milestone') del jugador.
CREATE INDEX IF NOT EXISTS timeline_events_user_kind_time_idx
  ON public.timeline_events (user_id, kind, occurred_at DESC);

-- Seguimientos y calendario académico.
CREATE INDEX IF NOT EXISTS follow_ups_created_at_idx
  ON public.follow_ups (created_at DESC);
CREATE INDEX IF NOT EXISTS academic_calendar_dates_idx
  ON public.academic_calendar (start_date, end_date);

