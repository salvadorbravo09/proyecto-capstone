ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
