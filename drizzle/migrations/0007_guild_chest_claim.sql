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
