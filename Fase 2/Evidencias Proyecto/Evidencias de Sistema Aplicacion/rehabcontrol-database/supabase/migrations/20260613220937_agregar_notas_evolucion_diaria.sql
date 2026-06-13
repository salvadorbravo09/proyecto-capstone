CREATE TABLE IF NOT EXISTS public.notas_evolucion_diaria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  kinesiologo_id uuid NOT NULL REFERENCES public.kinesiologos(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  notas text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(paciente_id, kinesiologo_id, fecha)
);

ALTER TABLE public.notas_evolucion_diaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY notas_evolucion_diaria_select_kin_or_admin
ON public.notas_evolucion_diaria FOR SELECT
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
);

CREATE POLICY notas_evolucion_diaria_insert_kin_or_admin
ON public.notas_evolucion_diaria FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.usuario_id = auth.uid()
  )
);

CREATE POLICY notas_evolucion_diaria_update_kin_or_admin
ON public.notas_evolucion_diaria FOR UPDATE
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

CREATE POLICY notas_evolucion_diaria_delete_admin
ON public.notas_evolucion_diaria FOR DELETE
USING (public.is_admin());
