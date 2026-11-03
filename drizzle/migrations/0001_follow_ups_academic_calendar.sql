CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  psychologist_id uuid NOT NULL DEFAULT auth.uid(),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Psicologos leen seguimientos" ON public.follow_ups FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'psicologo'));
CREATE POLICY "Psicologos registran seguimientos propios" ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'psicologo') AND psychologist_id = auth.uid() AND char_length(note) <= 1000);
CREATE INDEX follow_ups_student_idx ON public.follow_ups (student_id, created_at DESC);

CREATE TABLE public.academic_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  kind text NOT NULL DEFAULT 'parciales',
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_calendar_range CHECK (end_date >= start_date)
);
GRANT SELECT, INSERT, DELETE ON public.academic_calendar TO authenticated;
GRANT ALL ON public.academic_calendar TO service_role;
ALTER TABLE public.academic_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados leen calendario" ON public.academic_calendar FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo crea periodos" ON public.academic_calendar FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Equipo elimina periodos" ON public.academic_calendar FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));