-- Agregar kinesiologo_asignado_id a pacientes
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS kinesiologo_asignado_id uuid REFERENCES public.kinesiologos(id) ON DELETE SET NULL;

-- Actualizar políticas RLS para pacientes
DROP POLICY IF EXISTS pacientes_select_own_kin_or_admin ON public.pacientes;
DROP POLICY IF EXISTS pacientes_insert_self_or_staff ON public.pacientes;
DROP POLICY IF EXISTS pacientes_update_self_or_staff ON public.pacientes;
DROP POLICY IF EXISTS pacientes_delete_admin ON public.pacientes;

-- SELECT: Admin ve todos, kinesiologo ve sus pacientes asignados, paciente ve su propio registro
CREATE POLICY pacientes_select_own_kin_or_admin
ON public.pacientes
FOR SELECT
USING (
  usuario_id = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = pacientes.kinesiologo_asignado_id
  )
);

-- INSERT: Admin o kinesiólogo (se asigna a sí mismo)
CREATE POLICY pacientes_insert_self_or_staff
ON public.pacientes
FOR INSERT
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = kinesiologo_asignado_id
  )
);

-- UPDATE: Admin, o kinesiólogo de sus pacientes asignados
CREATE POLICY pacientes_update_self_or_staff
ON public.pacientes
FOR UPDATE
USING (
  usuario_id = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = pacientes.kinesiologo_asignado_id
  )
)
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = pacientes.kinesiologo_asignado_id
  )
);

-- DELETE: Solo admin
CREATE POLICY pacientes_delete_admin
ON public.pacientes
FOR DELETE
USING (public.is_admin());

-- También actualizar RLS de citas para que kinesiologo solo vea citas de sus pacientes
DROP POLICY IF EXISTS citas_select_own_kin_or_admin ON public.citas;
DROP POLICY IF EXISTS citas_insert_own_kin_or_admin ON public.citas;
DROP POLICY IF EXISTS citas_update_own_kin_or_admin ON public.citas;
DROP POLICY IF EXISTS citas_delete_kin_or_admin ON public.citas;

CREATE POLICY citas_select_own_kin_or_admin
ON public.citas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND (
        k.id = citas.kinesiologo_id
        OR k.id = (SELECT kinesiologo_asignado_id FROM public.pacientes WHERE id = citas.paciente_id)
      )
  )
  OR public.is_admin()
);

CREATE POLICY citas_insert_own_kin_or_admin
ON public.citas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND (
        k.id = citas.kinesiologo_id
        OR k.id = (SELECT kinesiologo_asignado_id FROM public.pacientes WHERE id = citas.paciente_id)
      )
  )
  OR public.is_admin()
);

CREATE POLICY citas_update_own_kin_or_admin
ON public.citas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND (
        k.id = citas.kinesiologo_id
        OR k.id = (SELECT kinesiologo_asignado_id FROM public.pacientes WHERE id = citas.paciente_id)
      )
  )
  OR public.is_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND (
        k.id = citas.kinesiologo_id
        OR k.id = (SELECT kinesiologo_asignado_id FROM public.pacientes WHERE id = citas.paciente_id)
      )
  )
  OR public.is_admin()
);

CREATE POLICY citas_delete_kin_or_admin
ON public.citas
FOR DELETE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND (
        k.id = citas.kinesiologo_id
        OR k.id = (SELECT kinesiologo_asignado_id FROM public.pacientes WHERE id = citas.paciente_id)
      )
  )
);

-- Actualizar RLS de fichas_clinicas
DROP POLICY IF EXISTS fichas_clinicas_select_own_kin_or_admin ON public.fichas_clinicas;
DROP POLICY IF EXISTS fichas_clinicas_insert_kin_or_admin ON public.fichas_clinicas;
DROP POLICY IF EXISTS fichas_clinicas_update_kin_or_admin ON public.fichas_clinicas;
DROP POLICY IF EXISTS fichas_clinicas_delete_admin ON public.fichas_clinicas;

CREATE POLICY fichas_clinicas_select_own_kin_or_admin
ON public.fichas_clinicas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = fichas_clinicas.kinesiologo_id
  )
  OR public.is_admin()
);

CREATE POLICY fichas_clinicas_insert_kin_or_admin
ON public.fichas_clinicas
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = fichas_clinicas.kinesiologo_id
  )
);

CREATE POLICY fichas_clinicas_update_kin_or_admin
ON public.fichas_clinicas
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = fichas_clinicas.kinesiologo_id
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = fichas_clinicas.kinesiologo_id
  )
);

CREATE POLICY fichas_clinicas_delete_admin
ON public.fichas_clinicas
FOR DELETE
USING (public.is_admin());

-- Actualizar RLS de planes_tratamiento
DROP POLICY IF EXISTS planes_tratamiento_select_own_kin_or_admin ON public.planes_tratamiento;
DROP POLICY IF EXISTS planes_tratamiento_insert_kin_or_admin ON public.planes_tratamiento;
DROP POLICY IF EXISTS planes_tratamiento_update_kin_or_admin ON public.planes_tratamiento;
DROP POLICY IF EXISTS planes_tratamiento_delete_admin ON public.planes_tratamiento;

CREATE POLICY planes_tratamiento_select_own_kin_or_admin
ON public.planes_tratamiento
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = planes_tratamiento.kinesiologo_id
  )
  OR public.is_admin()
);

CREATE POLICY planes_tratamiento_insert_kin_or_admin
ON public.planes_tratamiento
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = planes_tratamiento.kinesiologo_id
  )
);

CREATE POLICY planes_tratamiento_update_kin_or_admin
ON public.planes_tratamiento
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = planes_tratamiento.kinesiologo_id
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
      AND k.id = planes_tratamiento.kinesiologo_id
  )
);

CREATE POLICY planes_tratamiento_delete_admin
ON public.planes_tratamiento
FOR DELETE
USING (public.is_admin());

-- Actualizar RLS de seguimiento_progreso
DROP POLICY IF EXISTS seguimiento_progreso_select_own_kin_or_admin ON public.seguimiento_progreso;
DROP POLICY IF EXISTS seguimiento_progreso_insert_own_kin_or_admin ON public.seguimiento_progreso;
DROP POLICY IF EXISTS seguimiento_progreso_update_own_kin_or_admin ON public.seguimiento_progreso;
DROP POLICY IF EXISTS seguimiento_progreso_delete_kin_or_admin ON public.seguimiento_progreso;

CREATE POLICY seguimiento_progreso_select_own_kin_or_admin
ON public.seguimiento_progreso
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.plan_detalle pd
    JOIN public.planes_tratamiento pt ON pt.id = pd.plan_id
    LEFT JOIN public.pacientes p ON p.id = pt.paciente_id
    LEFT JOIN public.kinesiologos k ON k.id = pt.kinesiologo_id
    WHERE pd.id = plan_detalle_id
      AND (
        p.usuario_id = auth.uid()
        OR k.usuario_id = auth.uid()
      )
  )
  OR public.is_admin()
);

CREATE POLICY seguimiento_progreso_insert_own_kin_or_admin
ON public.seguimiento_progreso
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.plan_detalle pd
    JOIN public.planes_tratamiento pt ON pt.id = pd.plan_id
    LEFT JOIN public.pacientes p ON p.id = pt.paciente_id
    WHERE pd.id = plan_detalle_id
      AND (
        p.usuario_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.kinesiologos k
          WHERE k.usuario_id = auth.uid() AND k.id = pt.kinesiologo_id
        )
      )
  )
);

CREATE POLICY seguimiento_progreso_update_own_kin_or_admin
ON public.seguimiento_progreso
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.plan_detalle pd
    JOIN public.planes_tratamiento pt ON pt.id = pd.plan_id
    LEFT JOIN public.pacientes p ON p.id = pt.paciente_id
    WHERE pd.id = plan_detalle_id
      AND (
        p.usuario_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.kinesiologos k
          WHERE k.usuario_id = auth.uid() AND k.id = pt.kinesiologo_id
        )
      )
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.plan_detalle pd
    JOIN public.planes_tratamiento pt ON pt.id = pd.plan_id
    LEFT JOIN public.pacientes p ON p.id = pt.paciente_id
    WHERE pd.id = plan_detalle_id
      AND (
        p.usuario_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.kinesiologos k
          WHERE k.usuario_id = auth.uid() AND k.id = pt.kinesiologo_id
        )
      )
  )
);

CREATE POLICY seguimiento_progreso_delete_kin_or_admin
ON public.seguimiento_progreso
FOR DELETE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.plan_detalle pd
    JOIN public.planes_tratamiento pt ON pt.id = pd.plan_id
    JOIN public.kinesiologos k ON k.id = pt.kinesiologo_id
    WHERE pd.id = plan_detalle_id
      AND k.usuario_id = auth.uid()
  )
);
