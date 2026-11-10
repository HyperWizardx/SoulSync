-- Gremios: grupos de 3 a 5 estudiantes con un reto semanal compartido (sin ranking).
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

CREATE POLICY "members read own guild" ON public.guilds FOR SELECT TO authenticated
  USING (id = (SELECT public.my_guild_id()));
CREATE POLICY "members read guild members" ON public.guild_members FOR SELECT TO authenticated
  USING (guild_id = (SELECT public.my_guild_id()));
CREATE POLICY "users read own chest claims" ON public.guild_chest_claims FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
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
