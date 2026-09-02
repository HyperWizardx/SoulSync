-- Inventario: cantidad, tipo y equipado
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS item_key text,
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'consumable',
  ADD COLUMN IF NOT EXISTS equipped boolean NOT NULL DEFAULT false;

-- Permite actualizar cantidad / equipado desde el cliente autenticado
DROP POLICY IF EXISTS "users update own inventory" ON public.inventory;
CREATE POLICY "users update own inventory" ON public.inventory
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Categoría de misión completada (para logros por tipo de actividad)
ALTER TABLE public.mission_completions
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'autocuidado';

-- Recompensa otorgada al desbloquear un logro
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS reward_xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_gems integer NOT NULL DEFAULT 0;

-- Efectos activos de objetos
CREATE TABLE IF NOT EXISTS public.item_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_key text NOT NULL,
  effect text NOT NULL,
  magnitude numeric NOT NULL DEFAULT 0,
  uses_left integer,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_effects TO authenticated;
GRANT ALL ON public.item_effects TO service_role;

ALTER TABLE public.item_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own item effects" ON public.item_effects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own item effects" ON public.item_effects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own item effects" ON public.item_effects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own item effects" ON public.item_effects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS item_effects_user_idx ON public.item_effects (user_id, effect);