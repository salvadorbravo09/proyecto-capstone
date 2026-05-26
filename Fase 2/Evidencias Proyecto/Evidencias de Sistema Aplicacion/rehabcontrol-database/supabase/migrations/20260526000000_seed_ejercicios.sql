-- ==========================================
-- Seed data for catalog tables
-- ==========================================

-- 1. Previsiones
INSERT INTO public.previsiones (nombre) VALUES 
  ('FONASA'),
  ('Isapre'),
  ('Particular'),
  ('OTRA')
ON CONFLICT (nombre) DO NOTHING;

-- 2. Especialidades
INSERT INTO public.especialidades (nombre) VALUES 
  ('Fisioterapia'),
  ('Kinesiología Deportiva'),
  ('Kinesiología Respiratoria'),
  ('Kinesiología Neurológica')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Ejercicios predefinidos
INSERT INTO public.ejercicios (nombre, descripcion, parte_cuerpo) VALUES
  ('Elevación de pierna recta', 'Acostado boca arriba, elevar la pierna extendida 30 cm, mantener 3 segundos y bajar lentamente.', 'Pierna'),
  ('Flexión de rodilla asistida', 'Sentado en una silla, deslizar el pie hacia atrás flexionando la rodilla con ayuda de una toalla.', 'Rodilla'),
  ('Puente de glúteos', 'Acostado boca arriba con rodillas flexionadas, elevar la cadera hacia arriba contrayendo los glúteos.', 'Glúteos'),
  ('Estiramiento de isquiotibiales', 'Sentado con pierna extendida, llevar las manos hacia el pie sin doblar la rodilla.', 'Pierna'),
  ('Bicicleta estática', 'Pedaleo suave sin resistencia durante 10 minutos.', 'General')
ON CONFLICT DO NOTHING;

-- ==========================================
-- Update RLS: solo admin puede modificar ejercicios
-- ==========================================

ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ejercicios_insert_kin_or_admin" ON public.ejercicios;
DROP POLICY IF EXISTS "ejercicios_update_own_or_admin" ON public.ejercicios;
DROP POLICY IF EXISTS "ejercicios_delete_own_or_admin" ON public.ejercicios;

CREATE POLICY "ejercicios_insert_admin"
ON public.ejercicios
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "ejercicios_update_admin"
ON public.ejercicios
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "ejercicios_delete_admin"
ON public.ejercicios
FOR DELETE
USING (public.is_admin());
