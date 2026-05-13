ALTER TABLE public.kinesiologos
  ADD COLUMN IF NOT EXISTS nombre text,
  ADD COLUMN IF NOT EXISTS apellido text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS rut text;

UPDATE public.kinesiologos
SET
  nombre = CASE
    WHEN nombre_completo IS NULL OR btrim(nombre_completo) = '' THEN NULL
    WHEN position(' ' in btrim(nombre_completo)) = 0 THEN btrim(nombre_completo)
    ELSE split_part(btrim(nombre_completo), ' ', 1)
  END,
  apellido = CASE
    WHEN nombre_completo IS NULL OR btrim(nombre_completo) = '' THEN NULL
    WHEN position(' ' in btrim(nombre_completo)) = 0 THEN ''
    ELSE btrim(substr(btrim(nombre_completo), length(split_part(btrim(nombre_completo), ' ', 1)) + 2))
  END
WHERE nombre_completo IS NOT NULL;

ALTER TABLE public.kinesiologos
  ALTER COLUMN nombre SET NOT NULL,
  ALTER COLUMN apellido SET NOT NULL;

ALTER TABLE public.kinesiologos
  ADD CONSTRAINT kinesiologos_rut_key UNIQUE (rut);

ALTER TABLE public.kinesiologos
  DROP COLUMN IF EXISTS nombre_completo,
  DROP COLUMN IF EXISTS clinica_id;