-- =========================
-- TABLA: usuarios
-- =========================
CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    password text NOT NULL,
    rol public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- =========================
-- TABLA: pacientes
-- =========================
CREATE TABLE public.pacientes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id uuid,
    rut text NOT NULL,
    nombre_completo text NOT NULL,
    fecha_nacimiento date,
    telefono text,
    prevision text
);

-- =========================
-- TABLA: kinesiologos
-- =========================
CREATE TABLE public.kinesiologos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id uuid,
    nombre_completo text NOT NULL,
    especialidad text,
    registro_minsal text
);

-- =========================
-- TABLA: citas
-- =========================
CREATE TABLE public.citas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id uuid,
    kinesiologo_id uuid,
    fecha date NOT NULL,
    hora time NOT NULL,
    estado public.appointment_status DEFAULT 'agendada',
    motivo_consulta text
);

-- =========================
-- TABLA: ejercicios
-- =========================
CREATE TABLE public.ejercicios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    kinesiologo_creador uuid,
    nombre text NOT NULL,
    descripcion text,
    url_multimedia text,
    parte_cuerpo text
);

-- =========================
-- TABLA: fichas_clinicas
-- =========================
CREATE TABLE public.fichas_clinicas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id uuid,
    kinesiologo_id uuid,
    fecha_atencion timestamp with time zone DEFAULT now(),
    diagnostico text NOT NULL,
    notas_evolucion text
);

-- =========================
-- TABLA: planes_tratamiento
-- =========================
CREATE TABLE public.planes_tratamiento (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id uuid,
    kinesiologo_id uuid,
    fecha_inicio date DEFAULT CURRENT_DATE,
    fecha_fin date,
    objetivo_terapeutico text
);

-- =========================
-- TABLA: plan_detalle
-- =========================
CREATE TABLE public.plan_detalle (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id uuid,
    ejercicio_id uuid,
    series integer NOT NULL,
    repeticiones integer NOT NULL,
    frecuencia_diaria integer DEFAULT 1
);

-- =========================
-- TABLA: seguimiento_progreso
-- =========================
CREATE TABLE public.seguimiento_progreso (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_detalle_id uuid,
    fecha_registro timestamp with time zone DEFAULT now(),
    completado boolean DEFAULT false,
    nivel_dolor integer CHECK (nivel_dolor >= 1 AND nivel_dolor <= 10)
);

-- =====================================================
-- 🔗 RELACIONES (FOREIGN KEYS)
-- =====================================================

-- CITAS
ALTER TABLE public.citas
ADD CONSTRAINT citas_kinesiologo_id_fkey
FOREIGN KEY (kinesiologo_id) REFERENCES public.kinesiologos(id);

ALTER TABLE public.citas
ADD CONSTRAINT citas_paciente_id_fkey
FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);

-- EJERCICIOS
ALTER TABLE public.ejercicios
ADD CONSTRAINT ejercicios_kinesiologo_creador_fkey
FOREIGN KEY (kinesiologo_creador) REFERENCES public.kinesiologos(id);

-- FICHAS CLINICAS
ALTER TABLE public.fichas_clinicas
ADD CONSTRAINT fichas_clinicas_kinesiologo_id_fkey
FOREIGN KEY (kinesiologo_id) REFERENCES public.kinesiologos(id);

ALTER TABLE public.fichas_clinicas
ADD CONSTRAINT fichas_clinicas_paciente_id_fkey
FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);

-- USUARIOS RELACIONADOS
ALTER TABLE public.kinesiologos
ADD CONSTRAINT kinesiologos_usuario_id_fkey
FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

ALTER TABLE public.pacientes
ADD CONSTRAINT pacientes_usuario_id_fkey
FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- PLANES Y DETALLE
ALTER TABLE public.plan_detalle
ADD CONSTRAINT plan_detalle_ejercicio_id_fkey
FOREIGN KEY (ejercicio_id) REFERENCES public.ejercicios(id);

ALTER TABLE public.plan_detalle
ADD CONSTRAINT plan_detalle_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES public.planes_tratamiento(id) ON DELETE CASCADE;

-- PLANES TRATAMIENTO
ALTER TABLE public.planes_tratamiento
ADD CONSTRAINT planes_tratamiento_kinesiologo_id_fkey
FOREIGN KEY (kinesiologo_id) REFERENCES public.kinesiologos(id);

ALTER TABLE public.planes_tratamiento
ADD CONSTRAINT planes_tratamiento_paciente_id_fkey
FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);

-- SEGUIMIENTO
ALTER TABLE public.seguimiento_progreso
ADD CONSTRAINT seguimiento_progreso_plan_detalle_id_fkey
FOREIGN KEY (plan_detalle_id) REFERENCES public.plan_detalle(id) ON DELETE CASCADE;