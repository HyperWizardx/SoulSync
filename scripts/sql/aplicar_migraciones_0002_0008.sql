-- SoulSync · Migraciones pendientes 0002 a 0008 en un solo script.
-- Uso: Lovable → pestaña Cloud → Database → SQL editor: pega todo este archivo y pulsa Run.
-- Es idempotente (se puede ejecutar más de una vez) y va en una sola transacción: si algo
-- falla, no se aplica nada. Es el mismo SQL de drizzle/migrations, en orden.
BEGIN;

-- ===================== 0002_performance_indexes =====================
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

-- ===================== 0003_rls_initplan =====================
-- Rendimiento de las políticas de seguridad (RLS).
-- Las políticas comparaban auth.uid() y llamaban a is_admin()/has_role() por cada fila leída.
-- Envolverlas en (SELECT ...) hace que Postgres las evalúe una sola vez por consulta
-- (recomendación "auth_rls_initplan" de Supabase). Las reglas de acceso no cambian:
-- solo se reescribe la expresión de cada política existente del esquema public.
DO $$
DECLARE
  pol record;
  new_qual text;
  new_check text;
  stmt text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual, '') LIKE '%auth.uid()%' OR coalesce(with_check, '') LIKE '%auth.uid()%')
  LOOP
    new_qual := pol.qual;
    new_check := pol.with_check;

    FOR i IN 1..2 LOOP
      DECLARE expr text := CASE WHEN i = 1 THEN new_qual ELSE new_check END;
      BEGIN
        IF expr IS NOT NULL THEN
          -- 1. Protege las llamadas ya envueltas (en cualquiera de sus formas) para no duplicarlas.
          expr := replace(expr, '( SELECT auth.uid() AS uid)', '__UID__');
          expr := replace(expr, '(SELECT auth.uid())', '__UID__');
          -- 2. Envuelve el resto de auth.uid().
          expr := replace(expr, 'auth.uid()', '__UID__');
          -- 3. Las funciones de rol también se evalúan una vez por consulta (sin re-envolver las ya envueltas).
          expr := regexp_replace(expr, '(?<!SELECT )(?<!SELECT public\.)(public\.)?is_admin\(__UID__\)', '(SELECT public.is_admin(__UID__))', 'g');
          expr := regexp_replace(expr, '(?<!SELECT )(?<!SELECT public\.)(public\.)?has_role\(__UID__,(''[a-z_]+''::(public\.)?app_role)\)', '(SELECT public.has_role(__UID__, \2))', 'g');
          expr := replace(expr, '__UID__', '(SELECT auth.uid())');
          IF i = 1 THEN new_qual := expr; ELSE new_check := expr; END IF;
        END IF;
      END;
    END LOOP;

    IF new_qual IS DISTINCT FROM pol.qual OR new_check IS DISTINCT FROM pol.with_check THEN
      stmt := format('ALTER POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
      IF new_qual IS NOT NULL THEN stmt := stmt || format(' USING (%s)', new_qual); END IF;
      IF new_check IS NOT NULL THEN stmt := stmt || format(' WITH CHECK (%s)', new_check); END IF;
      EXECUTE stmt;
    END IF;
  END LOOP;
END $$;

-- ===================== 0004_activity_logs =====================
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

-- ===================== 0005_models_and_recommendations =====================
-- Modelos versionados y registro de recomendaciones (IA propia de SoulSync).
-- Idempotente: se puede ejecutar de nuevo sin error (tablas IF NOT EXISTS, políticas recreadas).
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
DROP POLICY IF EXISTS "authenticated read model versions" ON public.model_versions;
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
DROP POLICY IF EXISTS "users read own recommendations" ON public.recommendation_log;
CREATE POLICY "users read own recommendations" ON public.recommendation_log FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users insert own recommendations" ON public.recommendation_log;
CREATE POLICY "users insert own recommendations" ON public.recommendation_log FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users update own recommendations" ON public.recommendation_log;
CREATE POLICY "users update own recommendations" ON public.recommendation_log FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users delete own recommendations" ON public.recommendation_log;
CREATE POLICY "users delete own recommendations" ON public.recommendation_log FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "admins read all recommendation_log" ON public.recommendation_log;
CREATE POLICY "admins read all recommendation_log" ON public.recommendation_log FOR SELECT TO authenticated
  USING ((SELECT public.is_admin((SELECT auth.uid()))));
CREATE INDEX IF NOT EXISTS recommendation_log_date_idx ON public.recommendation_log (rec_date);

-- ===================== 0006_guilds =====================
-- Gremios: grupos de 3 a 5 estudiantes con un reto semanal compartido (sin ranking).
-- Idempotente: se puede ejecutar de nuevo sin error (tablas IF NOT EXISTS, políticas recreadas).
-- guilds / guild_members: cada estudiante pertenece a lo sumo a un gremio; solo los miembros
-- ven su gremio. Crear, unirse y salir se hace con funciones SECURITY DEFINER que validan
-- el cupo (máx. 5) y generan el código. guild_chest_claims: cofre semanal, uno por miembro.
CREATE TABLE IF NOT EXISTS public.guilds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 30),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-HJKMNP-Z2-9]{6}$'),
  emblem text NOT NULL DEFAULT 'lobo' CHECK (char_length(emblem) <= 20),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guild_members (
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id),
  CONSTRAINT guild_members_one_guild UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS guild_members_guild_idx ON public.guild_members (guild_id);

CREATE TABLE IF NOT EXISTS public.guild_chest_claims (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  guild_id uuid REFERENCES public.guilds(id) ON DELETE SET NULL,
  coins integer NOT NULL DEFAULT 0,
  gems integer NOT NULL DEFAULT 0,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

GRANT SELECT ON public.guilds, public.guild_members TO authenticated;
GRANT SELECT, INSERT ON public.guild_chest_claims TO authenticated;
GRANT ALL ON public.guilds, public.guild_members, public.guild_chest_claims TO service_role;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_chest_claims ENABLE ROW LEVEL SECURITY;

-- Gremio del usuario actual (SECURITY DEFINER evita la recursión de RLS en guild_members).
CREATE OR REPLACE FUNCTION public.my_guild_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT guild_id FROM public.guild_members WHERE user_id = auth.uid()
$$;

DROP POLICY IF EXISTS "members read own guild" ON public.guilds;
CREATE POLICY "members read own guild" ON public.guilds FOR SELECT TO authenticated
  USING (id = (SELECT public.my_guild_id()));
DROP POLICY IF EXISTS "members read guild members" ON public.guild_members;
CREATE POLICY "members read guild members" ON public.guild_members FOR SELECT TO authenticated
  USING (guild_id = (SELECT public.my_guild_id()));
DROP POLICY IF EXISTS "users read own chest claims" ON public.guild_chest_claims;
CREATE POLICY "users read own chest claims" ON public.guild_chest_claims FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users insert own chest claims" ON public.guild_chest_claims;
CREATE POLICY "users insert own chest claims" ON public.guild_chest_claims FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Funda un gremio y entra en él. Devuelve el código para invitar.
CREATE OR REPLACE FUNCTION public.create_guild(_name text, _emblem text)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  _code text;
  _gid uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.guild_members WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'Ya perteneces a un gremio';
  END IF;
  LOOP
    _code := '';
    FOR i IN 1..6 LOOP
      _code := _code || substr(_alphabet, 1 + floor(random() * length(_alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.guilds WHERE code = _code);
  END LOOP;
  INSERT INTO public.guilds (name, code, emblem, created_by) VALUES (btrim(_name), _code, _emblem, _uid) RETURNING id INTO _gid;
  INSERT INTO public.guild_members (guild_id, user_id) VALUES (_gid, _uid);
  RETURN _code;
END $$;

-- Se une a un gremio por código (máximo 5 miembros).
CREATE OR REPLACE FUNCTION public.join_guild(_code text)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _gid uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.guild_members WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'Ya perteneces a un gremio';
  END IF;
  SELECT id INTO _gid FROM public.guilds WHERE code = upper(btrim(_code)) FOR UPDATE;
  IF _gid IS NULL THEN RAISE EXCEPTION 'Código de gremio no encontrado'; END IF;
  IF (SELECT count(*) FROM public.guild_members WHERE guild_id = _gid) >= 5 THEN
    RAISE EXCEPTION 'El gremio ya está completo';
  END IF;
  INSERT INTO public.guild_members (guild_id, user_id) VALUES (_gid, _uid);
  RETURN _gid;
END $$;

-- Sale del gremio; el gremio vacío se disuelve.
CREATE OR REPLACE FUNCTION public.leave_guild()
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _gid uuid;
BEGIN
  DELETE FROM public.guild_members WHERE user_id = _uid RETURNING guild_id INTO _gid;
  IF _gid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.guild_members WHERE guild_id = _gid) THEN
    DELETE FROM public.guilds WHERE id = _gid;
  END IF;
END $$;

-- Miembros del gremio propio: solo nombre visible, arquetipo y nivel (nada de bienestar).
CREATE OR REPLACE FUNCTION public.guild_roster()
RETURNS TABLE (user_id uuid, name text, archetype integer, level integer, joined_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.user_id, coalesce(p.name, 'Héroe'), p.archetype, coalesce(p.level, 1), m.joined_at
  FROM public.guild_members m LEFT JOIN public.profiles p ON p.user_id = m.user_id
  WHERE m.guild_id = public.my_guild_id()
  ORDER BY m.joined_at
$$;

-- Progreso colectivo del reto: total de misiones y cuántos miembros aportaron (sin desglose
-- por persona, para que no haya ranking). Solo cuentan misiones hechas tras unirse.
CREATE OR REPLACE FUNCTION public.guild_week_progress(_since date, _categories text[])
RETURNS TABLE (total integer, contributors integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(c.*)::int, count(DISTINCT c.user_id)::int
  FROM public.guild_members m
  JOIN public.mission_completions c ON c.user_id = m.user_id
  WHERE m.guild_id = public.my_guild_id()
    AND c.completed_date >= _since
    AND c.completed_at >= m.joined_at
    AND c.category = ANY (_categories)
$$;

REVOKE ALL ON FUNCTION public.my_guild_id(), public.create_guild(text, text), public.join_guild(text), public.leave_guild(),
  public.guild_roster(), public.guild_week_progress(date, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_guild_id(), public.create_guild(text, text), public.join_guild(text), public.leave_guild(),
  public.guild_roster(), public.guild_week_progress(date, text[]) TO authenticated;

-- ===================== 0007_guild_chest_claim =====================
-- Revisión de la fase 3: el cofre semanal del gremio se abre solo con esta función, en una sola
-- transacción: valida la semana, el gremio (mínimo 3), la meta colectiva (3 misiones por miembro),
-- el aporte propio y que no se haya abierto antes; registra el cofre y entrega monedas y gemas.
-- Los estudiantes ya no pueden insertar cofres directamente (evita logros de gremio inflados).
-- El reto y la recompensa replican domain/community/guilds.ts (guildSql.test.ts lo verifica).
DROP POLICY IF EXISTS "users insert own chest claims" ON public.guild_chest_claims;
REVOKE INSERT ON public.guild_chest_claims FROM authenticated;

CREATE OR REPLACE FUNCTION public.claim_guild_chest(_week_start date)
RETURNS TABLE (reward_coins integer, reward_gems integer)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _gid uuid;
  _members integer;
  _total integer;
  _mine integer;
  _cats text[];
  _monday date := current_date - (extract(isodow FROM current_date)::integer - 1);
  _coins constant integer := 60;
  _gems constant integer := 2;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  -- Lunes de la semana del teléfono: el de hoy o el vecino (diferencia de zona horaria).
  IF extract(isodow FROM _week_start) <> 1 OR abs(_week_start - _monday) > 7 THEN
    RAISE EXCEPTION 'Semana no válida';
  END IF;
  SELECT gm.guild_id INTO _gid FROM public.guild_members gm WHERE gm.user_id = _uid;
  IF _gid IS NULL THEN RAISE EXCEPTION 'Aún no perteneces a un gremio'; END IF;
  -- Mismo reto que weeklyChallenge(): rotación semanal desde el lunes 2024-01-01.
  _cats := CASE (((_week_start - date '2024-01-01') / 7) % 5 + 5) % 5
    WHEN 0 THEN ARRAY['autocuidado']
    WHEN 1 THEN ARRAY['movimiento', 'ar']
    WHEN 2 THEN ARRAY['reflexion']
    WHEN 3 THEN ARRAY['social']
    ELSE ARRAY['cognitivo'] END;
  SELECT count(*) INTO _members FROM public.guild_members gm WHERE gm.guild_id = _gid;
  SELECT count(c.*), count(c.*) FILTER (WHERE c.user_id = _uid) INTO _total, _mine
  FROM public.guild_members m
  JOIN public.mission_completions c ON c.user_id = m.user_id
  WHERE m.guild_id = _gid
    AND c.completed_date >= _week_start AND c.completed_date < _week_start + 7
    AND c.completed_at >= m.joined_at
    AND c.category = ANY (_cats);
  IF _members < 3 OR _total < _members * 3 THEN
    RAISE EXCEPTION 'El gremio aún no supera el reto de la semana';
  END IF;
  IF _mine = 0 THEN RAISE EXCEPTION 'Completa una misión del reto para abrir tu cofre'; END IF;
  BEGIN
    INSERT INTO public.guild_chest_claims (user_id, week_start, guild_id, coins, gems)
    VALUES (_uid, _week_start, _gid, _coins, _gems);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Ya abriste el cofre de esta semana';
  END;
  UPDATE public.profiles p SET coins = coalesce(p.coins, 0) + _coins, gems = coalesce(p.gems, 0) + _gems
  WHERE p.user_id = _uid;
  RETURN QUERY SELECT _coins, _gems;
END $$;

REVOKE ALL ON FUNCTION public.claim_guild_chest(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_guild_chest(date) TO authenticated;

-- ===================== 0008_ai_lab =====================
-- Fase 4 (IA avanzada).
-- Idempotente: se puede ejecutar de nuevo sin error (tablas IF NOT EXISTS, políticas recreadas).
-- participant_profile: ficha OPCIONAL (edad, género y semestre por tramos, con "Prefiero no decir")
-- que solo se usa, agrupada y seudonimizada, en la auditoría de equidad. La ve su dueño y el rol
-- de investigación (nunca psicología); se borra al revocar el consentimiento.
-- save_compass_version / activate_compass: el equipo de investigación registra brújulas entrenadas
-- (inactivas) y activa una solo si superó la validación y la auditoría de equidad; 'decision-v4'
-- (criterio experto) siempre se puede reactivar para volver atrás.
CREATE TABLE IF NOT EXISTS public.participant_profile (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  age_band text NOT NULL DEFAULT 'no_dice' CHECK (age_band IN ('16-19', '20-24', '25+', 'no_dice')),
  gender text NOT NULL DEFAULT 'no_dice' CHECK (gender IN ('mujer', 'hombre', 'no_binario', 'otro', 'no_dice')),
  semester_band text NOT NULL DEFAULT 'no_dice' CHECK (semester_band IN ('1-3', '4-6', '7+', 'no_dice')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participant_profile TO authenticated;
GRANT ALL ON public.participant_profile TO service_role;
ALTER TABLE public.participant_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own participant profile" ON public.participant_profile;
CREATE POLICY "users read own participant profile" ON public.participant_profile FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users insert own participant profile" ON public.participant_profile;
CREATE POLICY "users insert own participant profile" ON public.participant_profile FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users update own participant profile" ON public.participant_profile;
CREATE POLICY "users update own participant profile" ON public.participant_profile FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users delete own participant profile" ON public.participant_profile;
CREATE POLICY "users delete own participant profile" ON public.participant_profile FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "researchers read participant profiles" ON public.participant_profile;
CREATE POLICY "researchers read participant profiles" ON public.participant_profile FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'investigador')));

CREATE OR REPLACE FUNCTION public.save_compass_version(_version text, _description text, _params jsonb, _metrics jsonb)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT coalesce(public.has_role(auth.uid(), 'investigador'), false) THEN
    RAISE EXCEPTION 'Solo el equipo de investigación puede registrar modelos';
  END IF;
  IF _version !~ '^brujula-map-[0-9]{8}-[0-9]{4}$' THEN RAISE EXCEPTION 'Versión no válida'; END IF;
  INSERT INTO public.model_versions (version, kind, description, params, metrics, active)
  VALUES (_version, 'brujula', left(_description, 500), coalesce(_params, '{}'::jsonb), coalesce(_metrics, '{}'::jsonb), false)
  ON CONFLICT (version) DO UPDATE
    SET description = EXCLUDED.description, params = EXCLUDED.params, metrics = EXCLUDED.metrics
    WHERE NOT public.model_versions.active;
END $$;

CREATE OR REPLACE FUNCTION public.activate_compass(_version text)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _metrics jsonb;
BEGIN
  IF NOT coalesce(public.has_role(auth.uid(), 'investigador'), false) THEN
    RAISE EXCEPTION 'Solo el equipo de investigación puede activar modelos';
  END IF;
  SELECT metrics INTO _metrics FROM public.model_versions WHERE version = _version AND kind = 'brujula';
  IF NOT FOUND THEN RAISE EXCEPTION 'Modelo no encontrado'; END IF;
  IF _version <> 'decision-v4' AND coalesce(_metrics #>> '{gate,ready}', 'false') <> 'true' THEN
    RAISE EXCEPTION 'Este modelo no superó la validación o la auditoría de equidad';
  END IF;
  UPDATE public.model_versions SET active = (version = _version) WHERE kind = 'brujula';
END $$;

REVOKE ALL ON FUNCTION public.save_compass_version(text, text, jsonb, jsonb), public.activate_compass(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_compass_version(text, text, jsonb, jsonb), public.activate_compass(text) TO authenticated;

COMMIT;
