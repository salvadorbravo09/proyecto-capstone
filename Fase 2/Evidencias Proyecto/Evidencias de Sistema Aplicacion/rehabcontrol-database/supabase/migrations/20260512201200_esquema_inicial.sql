CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. TIPOS PERSONALIZADOS (ENUMS)
-- ==========================================
CREATE TYPE public.appointment_status AS ENUM ('agendada', 'asistida', 'cancelada');
CREATE TYPE public.user_role AS ENUM ('admin', 'kinesiologo', 'paciente');

-- ==========================================
-- 2. CREACIÓN DE TABLAS Y RELACIONES
-- ==========================================

CREATE TABLE public.usuarios (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL UNIQUE,
  rol public.user_role NOT NULL DEFAULT 'paciente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);

CREATE TABLE public.pacientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid UNIQUE,
  rut text NOT NULL UNIQUE,
  nombre_completo text NOT NULL,
  fecha_nacimiento date,
  telefono text,
  prevision text,
  CONSTRAINT pacientes_pkey PRIMARY KEY (id),
  CONSTRAINT pacientes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.kinesiologos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid UNIQUE,
  nombre_completo text NOT NULL,
  especialidad text,
  registro_minsal text UNIQUE,
  clinica_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  CONSTRAINT kinesiologos_pkey PRIMARY KEY (id),
  CONSTRAINT kinesiologos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.citas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  kinesiologo_id uuid NOT NULL,
  fecha date NOT NULL,
  hora time without time zone NOT NULL,
  estado public.appointment_status NOT NULL DEFAULT 'agendada',
  motivo_consulta text,
  CONSTRAINT citas_pkey PRIMARY KEY (id),
  CONSTRAINT citas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE,
  CONSTRAINT citas_kinesiologo_id_fkey FOREIGN KEY (kinesiologo_id) REFERENCES public.kinesiologos(id) ON DELETE CASCADE
);

CREATE TABLE public.ejercicios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kinesiologo_creador uuid,
  nombre text NOT NULL,
  descripcion text,
  url_multimedia text,
  parte_cuerpo text,
  CONSTRAINT ejercicios_pkey PRIMARY KEY (id),
  CONSTRAINT ejercicios_kinesiologo_creador_fkey FOREIGN KEY (kinesiologo_creador) REFERENCES public.kinesiologos(id) ON DELETE SET NULL
);

CREATE TABLE public.fichas_clinicas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  kinesiologo_id uuid NOT NULL,
  fecha_atencion timestamp with time zone NOT NULL DEFAULT now(),
  diagnostico text NOT NULL,
  notas_evolucion text,
  CONSTRAINT fichas_clinicas_pkey PRIMARY KEY (id),
  CONSTRAINT fichas_clinicas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fichas_clinicas_kinesiologo_id_fkey FOREIGN KEY (kinesiologo_id) REFERENCES public.kinesiologos(id) ON DELETE CASCADE
);

CREATE TABLE public.planes_tratamiento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  kinesiologo_id uuid NOT NULL,
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin date,
  objetivo_terapeutico text,
  CONSTRAINT planes_tratamiento_pkey PRIMARY KEY (id),
  CONSTRAINT planes_tratamiento_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE,
  CONSTRAINT planes_tratamiento_kinesiologo_id_fkey FOREIGN KEY (kinesiologo_id) REFERENCES public.kinesiologos(id) ON DELETE CASCADE
);

CREATE TABLE public.plan_detalle (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  ejercicio_id uuid NOT NULL,
  series integer NOT NULL CHECK (series > 0),
  repeticiones integer NOT NULL CHECK (repeticiones > 0),
  frecuencia_diaria integer NOT NULL DEFAULT 1 CHECK (frecuencia_diaria > 0),
  CONSTRAINT plan_detalle_pkey PRIMARY KEY (id),
  CONSTRAINT plan_detalle_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planes_tratamiento(id) ON DELETE CASCADE,
  CONSTRAINT plan_detalle_ejercicio_id_fkey FOREIGN KEY (ejercicio_id) REFERENCES public.ejercicios(id) ON DELETE CASCADE
);

CREATE TABLE public.seguimiento_progreso (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_detalle_id uuid NOT NULL,
  fecha_registro timestamp with time zone NOT NULL DEFAULT now(),
  completado boolean NOT NULL DEFAULT false,
  nivel_dolor integer CHECK (nivel_dolor >= 1 AND nivel_dolor <= 10),
  CONSTRAINT seguimiento_progreso_pkey PRIMARY KEY (id),
  CONSTRAINT seguimiento_progreso_plan_detalle_id_fkey FOREIGN KEY (plan_detalle_id) REFERENCES public.plan_detalle(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. FUNCIONES AUXILIARES DE ROL
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = auth.uid()
      AND rol = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_kinesiologo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = auth.uid()
      AND rol = 'kinesiologo'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_paciente()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = auth.uid()
      AND rol = 'paciente'
  );
$$;

-- ==========================================
-- 4. TRIGGER SUPABASE AUTH
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value public.user_role;
BEGIN
  user_role_value := CASE lower(coalesce(new.raw_user_meta_data ->> 'rol', 'paciente'))
    WHEN 'admin' THEN 'admin'
    WHEN 'kinesiologo' THEN 'kinesiologo'
    ELSE 'paciente'
  END;

  INSERT INTO public.usuarios (id, email, rol)
  VALUES (new.id, new.email, user_role_value);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 5. RLS
-- ==========================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinesiologos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_tratamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimiento_progreso ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. POLÍTICAS RLS COMPLETAS
-- ==========================================

CREATE POLICY usuarios_select_own_or_admin
ON public.usuarios
FOR SELECT
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY usuarios_update_own_or_admin
ON public.usuarios
FOR UPDATE
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY usuarios_delete_admin
ON public.usuarios
FOR DELETE
USING (public.is_admin());

CREATE POLICY pacientes_select_own_kin_or_admin
ON public.pacientes
FOR SELECT
USING (
  usuario_id = auth.uid()
  OR public.is_admin()
  OR public.is_kinesiologo()
);

CREATE POLICY pacientes_insert_self_or_staff
ON public.pacientes
FOR INSERT
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin()
  OR public.is_kinesiologo()
);

CREATE POLICY pacientes_update_self_or_staff
ON public.pacientes
FOR UPDATE
USING (
  usuario_id = auth.uid()
  OR public.is_admin()
  OR public.is_kinesiologo()
)
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin()
  OR public.is_kinesiologo()
);

CREATE POLICY pacientes_delete_admin
ON public.pacientes
FOR DELETE
USING (public.is_admin());

CREATE POLICY kinesiologos_select_own_or_admin
ON public.kinesiologos
FOR SELECT
USING (
  usuario_id = auth.uid()
  OR public.is_admin()
);

CREATE POLICY kinesiologos_insert_self_or_admin
ON public.kinesiologos
FOR INSERT
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin()
);

CREATE POLICY kinesiologos_update_self_or_admin
ON public.kinesiologos
FOR UPDATE
USING (
  usuario_id = auth.uid()
  OR public.is_admin()
)
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin()
);

CREATE POLICY kinesiologos_delete_admin
ON public.kinesiologos
FOR DELETE
USING (public.is_admin());

CREATE POLICY citas_select_own_kin_or_admin
ON public.citas
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY citas_insert_own_kin_or_admin
ON public.citas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY citas_update_own_kin_or_admin
ON public.citas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
  OR public.is_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY citas_delete_kin_or_admin
ON public.citas
FOR DELETE
USING (public.is_admin() OR public.is_kinesiologo());

CREATE POLICY ejercicios_select_authenticated
ON public.ejercicios
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY ejercicios_insert_kin_or_admin
ON public.ejercicios
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_creador
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY ejercicios_update_own_or_admin
ON public.ejercicios
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_creador
      AND k.usuario_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_creador
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY ejercicios_delete_own_or_admin
ON public.ejercicios
FOR DELETE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_creador
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY fichas_clinicas_select_own_kin_or_admin
ON public.fichas_clinicas
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY fichas_clinicas_insert_kin_or_admin
ON public.fichas_clinicas
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY fichas_clinicas_update_kin_or_admin
ON public.fichas_clinicas
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY fichas_clinicas_delete_admin
ON public.fichas_clinicas
FOR DELETE
USING (public.is_admin());

CREATE POLICY planes_tratamiento_select_own_kin_or_admin
ON public.planes_tratamiento
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.pacientes p
    WHERE p.id = paciente_id
      AND p.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY planes_tratamiento_insert_kin_or_admin
ON public.planes_tratamiento
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY planes_tratamiento_update_kin_or_admin
ON public.planes_tratamiento
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.kinesiologos k
    WHERE k.id = kinesiologo_id
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY planes_tratamiento_delete_admin
ON public.planes_tratamiento
FOR DELETE
USING (public.is_admin());

CREATE POLICY plan_detalle_select_own_kin_or_admin
ON public.plan_detalle
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.planes_tratamiento pt
    WHERE pt.id = plan_id
      AND (
        EXISTS (
          SELECT 1
          FROM public.pacientes p
          WHERE p.id = pt.paciente_id
            AND p.usuario_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM public.kinesiologos k
          WHERE k.id = pt.kinesiologo_id
            AND k.usuario_id = auth.uid()
        )
      )
  )
  OR public.is_admin()
);

CREATE POLICY plan_detalle_insert_kin_or_admin
ON public.plan_detalle
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.planes_tratamiento pt
    JOIN public.kinesiologos k ON k.id = pt.kinesiologo_id
    WHERE pt.id = plan_id
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY plan_detalle_update_kin_or_admin
ON public.plan_detalle
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.planes_tratamiento pt
    JOIN public.kinesiologos k ON k.id = pt.kinesiologo_id
    WHERE pt.id = plan_id
      AND k.usuario_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.planes_tratamiento pt
    JOIN public.kinesiologos k ON k.id = pt.kinesiologo_id
    WHERE pt.id = plan_id
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY plan_detalle_delete_kin_or_admin
ON public.plan_detalle
FOR DELETE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.planes_tratamiento pt
    JOIN public.kinesiologos k ON k.id = pt.kinesiologo_id
    WHERE pt.id = plan_id
      AND k.usuario_id = auth.uid()
  )
);

CREATE POLICY seguimiento_progreso_select_own_kin_or_admin
ON public.seguimiento_progreso
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.plan_detalle pd
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
    SELECT 1
    FROM public.plan_detalle pd
    JOIN public.planes_tratamiento pt ON pt.id = pd.plan_id
    LEFT JOIN public.pacientes p ON p.id = pt.paciente_id
    LEFT JOIN public.kinesiologos k ON k.id = pt.kinesiologo_id
    WHERE pd.id = plan_detalle_id
      AND (
        p.usuario_id = auth.uid()
        OR k.usuario_id = auth.uid()
      )
  )
);

CREATE POLICY seguimiento_progreso_update_own_kin_or_admin
ON public.seguimiento_progreso
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plan_detalle pd
    JOIN public.planes_tratamiento pt ON pt.id = pd.plan_id
    LEFT JOIN public.pacientes p ON p.id = pt.paciente_id
    LEFT JOIN public.kinesiologos k ON k.id = pt.kinesiologo_id
    WHERE pd.id = plan_detalle_id
      AND (
        p.usuario_id = auth.uid()
        OR k.usuario_id = auth.uid()
      )
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plan_detalle pd
    JOIN public.planes_tratamiento pt ON pt.id = pd.plan_id
    LEFT JOIN public.pacientes p ON p.id = pt.paciente_id
    LEFT JOIN public.kinesiologos k ON k.id = pt.kinesiologo_id
    WHERE pd.id = plan_detalle_id
      AND (
        p.usuario_id = auth.uid()
        OR k.usuario_id = auth.uid()
      )
  )
);

CREATE POLICY seguimiento_progreso_delete_kin_or_admin
ON public.seguimiento_progreso
FOR DELETE
USING (public.is_admin() OR public.is_kinesiologo());