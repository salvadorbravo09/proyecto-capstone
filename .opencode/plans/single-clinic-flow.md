# Plan: Flujo Single-Clinic para RehabControl

## Contexto
Proyecto académico sin envío de emails. Enfoque single-clinic donde:
- **Admin** crea kinesiólogos con credenciales
- **Kinesiólogo** registra pacientes y les asigna credenciales
- **Paciente** usa credenciales recibidas para login en app móvil

## Estado Actual
- DB: Schema completo con RLS, pero falta `kinesiologo_asignado_id` en `pacientes`
- Web: Login funcional con role-routing, pero Dashboard y Pacientes no filtran por kinesiologo
- Web: AdminKinesiologos usa edge function `create-kinesiologo`
- Web: Pacientes.jsx crea pacientes sin auth ni asignación
- Mobile: Login mock (sin Supabase), Home con datos hardcodeados
- Edge functions: `create-kinesiologo` existe, `create-paciente` carpeta vacía

## Cambios a Realizar

### 1. Migración DB: `kinesiologo_asignado_id` + RLS
**Archivo:** `rehabcontrol-database/supabase/migrations/20260515000000_agregar_kinesiologo_asignado_pacientes.sql`

- Agregar columna `kinesiologo_asignado_id uuid` a `pacientes`
- Actualizar políticas RLS de `pacientes`:
  - SELECT: admin ve todos, kinesiologo ve sus asignados, paciente ve el suyo
  - INSERT/UPDATE: admin o kinesiologo (solo si es el asignado)
  - DELETE: solo admin

### 2. Edge Function: `create-paciente`
**Archivo:** `rehabcontrol-database/supabase/functions/create-paciente/index.ts`

Patrón similar a `create-kinesiologo`:
- Autorización: solo `kinesiologo` o `admin`
- Crea usuario en Supabase Auth con `email_confirm: true` y rol `paciente`
- Inserta registro en `pacientes` con `kinesiologo_asignado_id` del kinesiologo logueado
- Campos: nombre, apellido, email, password, rut, telefono, prevision, fecha_nacimiento

### 3. Web: Pacientes.jsx - Registro con auth + filtro por kinesiologo
**Archivo:** `rehabcontrol-web/src/pages/Pacientes.jsx`

- Formulario agrega campo `password` para el paciente
- Usa edge function `create-paciente` en lugar de insert directo
- Query filtra por `kinesiologo_asignado_id` del kinesiologo logueado
- Mostrar credenciales creadas al kinesiólogo tras éxito

### 4. Web: Dashboard.jsx - Filtrar por kinesiólogo logueado
**Archivo:** `rehabcontrol-web/src/pages/Dashboard.jsx`

- Obtener `kinesiologo_id` del usuario logueado
- Filtrar citas por `kinesiologo_id`
- Filtrar pacientes activos por `kinesiologo_asignado_id`

### 5. Web: Layout.jsx - Nombre del kinesiólogo
**Archivo:** `rehabcontrol-web/src/components/Layout.jsx`

- Obtener nombre desde tabla `kinesiologos` (no solo email)

### 6. Mobile: Login real con Supabase Auth
**Archivo:** `rehabcontrol-mobile/app/(auth)/login.jsx`

- Integrar `supabase.auth.signInWithPassword()`
- Verificar rol `paciente` (bloquear admin/kinesiologo)
- Navegar a `(main)/home` tras éxito
- Manejar errores

### 7. Mobile: Home con datos reales
**Archivos:** `rehabcontrol-mobile/app/(main)/home.tsx` y otros

- Obtener paciente logueado desde Supabase
- Fetch ejercicios asignados (planes_tratamiento → plan_detalle → ejercicios)
- Fetch citas próximas
- Fetch progreso (seguimiento_progreso)
- Botón "Seguimiento de Hoy" funcional (registrar nivel_dolor)

## Orden de Ejecución
1. Migración DB
2. Edge function create-paciente
3. Web: Pacientes.jsx
4. Web: Dashboard.jsx + Layout.jsx
5. Mobile: Login
6. Mobile: Home + datos reales
