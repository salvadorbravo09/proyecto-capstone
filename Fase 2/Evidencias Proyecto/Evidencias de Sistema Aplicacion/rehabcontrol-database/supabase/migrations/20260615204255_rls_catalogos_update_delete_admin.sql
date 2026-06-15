-- ==========================================
-- Agregar políticas UPDATE y DELETE para tablas
-- catálogo (faltantes de migraciones previas)
-- ==========================================

-- 1. Previsiones
CREATE POLICY previsiones_update_admin
ON public.previsiones FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY previsiones_delete_admin
ON public.previsiones FOR DELETE
USING (public.is_admin());

-- 2. Especialidades
CREATE POLICY especialidades_update_admin
ON public.especialidades FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY especialidades_delete_admin
ON public.especialidades FOR DELETE
USING (public.is_admin());

-- 3. Estados
CREATE POLICY estados_update_admin
ON public.estados FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY estados_delete_admin
ON public.estados FOR DELETE
USING (public.is_admin());
