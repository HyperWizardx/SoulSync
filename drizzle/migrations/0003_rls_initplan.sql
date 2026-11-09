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
