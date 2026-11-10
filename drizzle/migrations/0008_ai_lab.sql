-- Fase 4 (IA avanzada).
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
CREATE POLICY "users read own participant profile" ON public.participant_profile FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users insert own participant profile" ON public.participant_profile FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "users update own participant profile" ON public.participant_profile FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "users delete own participant profile" ON public.participant_profile FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
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
