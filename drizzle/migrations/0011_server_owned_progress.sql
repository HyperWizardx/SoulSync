-- Revisión de seguridad: el progreso del juego lo escribe solo el servidor.
-- Idempotente: se puede ejecutar de nuevo sin error.
-- Antes, cada estudiante podía cambiar con su propia sesión (sin pasar por la app) su nivel, XP,
-- monedas, gemas, racha, estadísticas, atributos, inventario, efectos de objetos, logros, misiones
-- cumplidas y Mundo. Desde aquí solo puede LEERLOS; las server functions los escriben con la clave
-- de servicio (infrastructure/persistence/supabase/gameWriter.ts) después de aplicar las reglas del
-- juego. Las funciones SECURITY DEFINER (registro, gremios, cofre) siguen funcionando porque corren
-- como dueñas de las tablas.

-- 1. Quitar toda política de escritura del navegador en las tablas del juego, también las que se
--    hubieran creado con otro nombre.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'user_stats', 'user_attributes', 'inventory', 'item_effects',
                        'achievements', 'mission_completions', 'world_state')
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2. Sin permiso de escritura para el navegador aunque alguien vuelva a crear una política.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.profiles, public.user_stats, public.user_attributes, public.inventory, public.item_effects,
  public.achievements, public.mission_completions, public.world_state
  FROM anon, authenticated;
GRANT SELECT ON
  public.profiles, public.user_stats, public.user_attributes, public.inventory, public.item_effects,
  public.achievements, public.mission_completions, public.world_state
  TO authenticated;
GRANT ALL ON
  public.profiles, public.user_stats, public.user_attributes, public.inventory, public.item_effects,
  public.achievements, public.mission_completions, public.world_state
  TO service_role;

-- 3. Lecturas propias solo con sesión iniciada (algunas estaban abiertas al rol "public").
DROP POLICY IF EXISTS "users read own profile" ON public.profiles;
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users read own stats" ON public.user_stats;
CREATE POLICY "users read own stats" ON public.user_stats FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users read own attrs" ON public.user_attributes;
CREATE POLICY "users read own attrs" ON public.user_attributes FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users read own inventory" ON public.inventory;
CREATE POLICY "users read own inventory" ON public.inventory FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users read own item effects" ON public.item_effects;
CREATE POLICY "users read own item effects" ON public.item_effects FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users read own achievements" ON public.achievements;
CREATE POLICY "users read own achievements" ON public.achievements FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users read own missions" ON public.mission_completions;
CREATE POLICY "users read own missions" ON public.mission_completions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "users read own world" ON public.world_state;
CREATE POLICY "users read own world" ON public.world_state FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 4. El rol anónimo (antes de iniciar sesión) no lee ni escribe ninguna tabla de la app: todo
--    pasa por server functions con sesión. RLS ya lo bloqueaba; esto lo deja explícito.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
