-- ==========================================
-- Habilitar RLS y agregar políticas para tablas
-- creadas en 20260516000000_ajustes_retroalimentacion
-- ==========================================

-- 1. Estados (catálogo de estados para citas, etc.)
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;

CREATE POLICY estados_select_authenticated
ON public.estados FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY estados_insert_admin
ON public.estados FOR INSERT
WITH CHECK (public.is_admin());

-- 2. Previsiones (catálogo)
ALTER TABLE public.previsiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY previsiones_select_authenticated
ON public.previsiones FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY previsiones_insert_admin
ON public.previsiones FOR INSERT
WITH CHECK (public.is_admin());

-- 3. Especialidades (catálogo)
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY especialidades_select_authenticated
ON public.especialidades FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY especialidades_insert_admin
ON public.especialidades FOR INSERT
WITH CHECK (public.is_admin());

-- 4. Estado_Historial
ALTER TABLE public.estado_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY estado_historial_select_authenticated
ON public.estado_historial FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY estado_historial_insert_authenticated
ON public.estado_historial FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 5. Fichas
ALTER TABLE public.fichas ENABLE ROW LEVEL SECURITY;

CREATE POLICY fichas_select_own_kin_or_admin
ON public.fichas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = paciente_id AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY fichas_insert_kin_or_admin
ON public.fichas FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
);

CREATE POLICY fichas_update_kin_or_admin
ON public.fichas FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
);

CREATE POLICY fichas_delete_admin
ON public.fichas FOR DELETE
USING (public.is_admin());

-- 6. Atenciones
ALTER TABLE public.atenciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY atenciones_select_own_kin_or_admin
ON public.atenciones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fichas f
    JOIN public.pacientes p ON p.id = f.paciente_id
    WHERE f.id = ficha_id AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY atenciones_insert_kin_or_admin
ON public.atenciones FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
);

CREATE POLICY atenciones_update_kin_or_admin
ON public.atenciones FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
);

CREATE POLICY atenciones_delete_admin
ON public.atenciones FOR DELETE
USING (public.is_admin());

-- ==========================================
-- Asegurar datos iniciales en catálogos
-- ==========================================

INSERT INTO public.estados (nombre, entidad) VALUES 
  ('agendada', 'citas'),
  ('asistida', 'citas'),
  ('cancelada', 'citas')
ON CONFLICT (nombre, entidad) DO NOTHING;
