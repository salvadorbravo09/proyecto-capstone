-- 1. Crear entidades de catálogo: Previsiones y Especialidades
CREATE TABLE IF NOT EXISTS public.previsiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text
);

CREATE TABLE IF NOT EXISTS public.especialidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text
);

-- 2. Migrar columnas en Pacientes y Kinesiologos a FKs
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS prevision_id uuid REFERENCES public.previsiones(id) ON DELETE SET NULL;

ALTER TABLE public.kinesiologos
  ADD COLUMN IF NOT EXISTS especialidad_id uuid REFERENCES public.especialidades(id) ON DELETE SET NULL;

-- 3. Crear entidad Estados
CREATE TABLE IF NOT EXISTS public.estados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  entidad text NOT NULL, -- ej: 'citas', 'fichas'
  descripcion text,
  UNIQUE(nombre, entidad)
);

-- Insertar estados iniciales para 'citas' como instancias en la tabla
INSERT INTO public.estados (nombre, entidad) VALUES 
  ('agendada', 'citas'),
  ('asistida', 'citas'),
  ('cancelada', 'citas')
ON CONFLICT DO NOTHING;

-- 4. Reemplazar el enum de estado en citas por relaciones hacia la tabla estados
ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS estado_id uuid REFERENCES public.estados(id) ON DELETE RESTRICT;

-- Asignar los estados correspondientes a los datos existentes (antes de borrar la columna "estado" vieja)
DO $$
DECLARE
  agendada_id uuid;
  asistida_id uuid;
  cancelada_id uuid;
BEGIN
  SELECT id INTO agendada_id FROM public.estados WHERE nombre = 'agendada' AND entidad = 'citas' LIMIT 1;
  SELECT id INTO asistida_id FROM public.estados WHERE nombre = 'asistida' AND entidad = 'citas' LIMIT 1;
  SELECT id INTO cancelada_id FROM public.estados WHERE nombre = 'cancelada' AND entidad = 'citas' LIMIT 1;

  UPDATE public.citas SET estado_id = agendada_id WHERE estado::text = 'agendada';
  UPDATE public.citas SET estado_id = asistida_id WHERE estado::text = 'asistida';
  UPDATE public.citas SET estado_id = cancelada_id WHERE estado::text = 'cancelada';
END $$;

-- Drop la columna vieja de estado (enum)
ALTER TABLE public.citas DROP COLUMN IF EXISTS estado;


-- 5. Crear Entidad Intersección para Historial de Cambios de Estados
CREATE TABLE IF NOT EXISTS public.estado_historial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_tipo text NOT NULL, -- Por polimorfismo: 'citas', 'fichas', etc.
  entidad_id uuid NOT NULL, 
  estado_id uuid NOT NULL REFERENCES public.estados(id) ON DELETE CASCADE,
  cambio_fecha timestamptz NOT NULL DEFAULT now(),
  comentario text, -- Opcional
  actor_id uuid REFERENCES public.kinesiologos(id) ON DELETE SET NULL -- Quién lo cambió, opcional porque "no hay usuario"
);


-- 6. Crear tabla Fichas (Cada ficha representa un tratamiento y un paciente tiene muchas)
CREATE TABLE IF NOT EXISTS public.fichas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  motivo_tratamiento text,
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre date, -- Opcional (nulo si sigue activo)
  created_at timestamptz NOT NULL DEFAULT now()
);


-- 7. Crear tabla Atenciones (1 a N con fichas, 0 a 1 con Citas)
CREATE TABLE IF NOT EXISTS public.atenciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id uuid NOT NULL REFERENCES public.fichas(id) ON DELETE CASCADE,
  cita_id uuid UNIQUE REFERENCES public.citas(id) ON DELETE SET NULL, -- Relación 0 a 1 con Citas, UNIQUE asegura que de ser asignada, sea exclusiva
  kinesiologo_id uuid NOT NULL REFERENCES public.kinesiologos(id) ON DELETE RESTRICT, -- Quien lo atendió
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  detalle_ejercicios jsonb, -- Opcional: Detalle de los ejercicios en la sesión
  plan_ejercicios jsonb,    -- Opcional: Plan de ejercicios para la casa
  created_at timestamptz NOT NULL DEFAULT now()
);
