-- Agregar campo email a la tabla pacientes
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kinesiologo_id uuid REFERENCES public.kinesiologos(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'registro_paciente',
  mensaje text,
  leida boolean NOT NULL DEFAULT false,
  confirmada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS para notificaciones
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Policy: Kinesiólogo ve sus notificaciones
CREATE POLICY notificaciones_select_kin
ON public.notificaciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id AND k.usuario_id = auth.uid()
  )
  OR public.is_admin()
);

-- Policy: Admin ve todas las notificaciones
CREATE POLICY notificaciones_select_admin
ON public.notificaciones
FOR SELECT
USING (public.is_admin());

-- Policy: Insertar notificación (vía trigger o función)
CREATE POLICY notificaciones_insert_kin_or_system
ON public.notificaciones
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id AND k.usuario_id = auth.uid()
  )
);

-- Policy: Kinesiólogo puede actualizar (confirmar)
CREATE POLICY notificaciones_update_kin
ON public.notificaciones
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id AND k.usuario_id = auth.uid()
  )
  OR public.is_admin()
);