# Esquema de la Base de Datos

Este documento describe la estructura de la base de datos de la aplicación.

## Tablas

### 1. `usuarios`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador único del usuario. |
| `email` | `text` | UNIQUE, NOT NULL | Correo electrónico del usuario. |
| `rol` | `USER-DEFINED` | NOT NULL | Rol del usuario en el sistema. |
| `created_at` | `timestamptz` | DEFAULT `now()` | Fecha de creación del registro. |

### 2. `clinica`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador único de la clínica. |
| `nombre_clinica`| `text` | | Nombre comercial de la clínica. |
| `direccion` | `text` | | Dirección física. |
| `ciudad` | `text` | | Ciudad donde está ubicada. |
| `telefono` | `text` | | Teléfono de contacto. |
| `correo` | `text` | | Correo electrónico de contacto. |
| `fecha_creacion`| `timestamptz` | NOT NULL, DEFAULT `now()` | Fecha de creación del registro. |

### 3. `kinesiologos`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador único del kinesiólogo. |
| `usuario_id` | `uuid` | FK (`usuarios.id`) | Relación con la cuenta de usuario. |
| `nombre_completo`| `text` | NOT NULL | Nombre del profesional. |
| `especialidad` | `text` | | Especialidad médica/kinesiológica. |
| `registro_minsal`| `text` | UNIQUE | Número de registro en el MINSAL. |
| `clinica_id` | `uuid` | UNIQUE, NOT NULL, FK (`clinica.id`) | Clínica a la que pertenece. |

### 4. `pacientes`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador único del paciente. |
| `usuario_id` | `uuid` | FK (`usuarios.id`) | Relación con la cuenta de usuario. |
| `rut` | `text` | UNIQUE, NOT NULL | RUT/DNI del paciente. |
| `nombre_completo`| `text` | NOT NULL | Nombre completo. |
| `fecha_nacimiento`| `date` | | Fecha de nacimiento. |
| `telefono` | `text` | | Teléfono de contacto. |
| `prevision` | `text` | | Sistema de salud (Fonasa, Isapre, etc). |

### 5. `citas`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador de la cita. |
| `paciente_id` | `uuid` | FK (`pacientes.id`) | Paciente agendado. |
| `kinesiologo_id`| `uuid` | FK (`kinesiologos.id`) | Profesional que atiende. |
| `fecha` | `date` | NOT NULL | Fecha agendada. |
| `hora` | `time` | NOT NULL | Hora agendada. |
| `estado` | `USER-DEFINED` | DEFAULT `'agendada'` | Estado de la cita. |
| `motivo_consulta`| `text` | | Motivo descrito para la cita. |

### 6. `fichas_clinicas`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador de la ficha. |
| `paciente_id` | `uuid` | FK (`pacientes.id`) | Paciente evaluado. |
| `kinesiologo_id`| `uuid` | FK (`kinesiologos.id`) | Profesional que evalúa. |
| `fecha_atencion`| `timestamptz` | DEFAULT `now()` | Fecha de la ficha/atención. |
| `diagnostico` | `text` | NOT NULL | Diagnóstico clínico. |
| `notas_evolucion`| `text` | | Notas adicionales de evolución. |

### 7. `ejercicios`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador del ejercicio. |
| `kinesiologo_creador`| `uuid`| FK (`kinesiologos.id`) | Profesional que registró el ejercicio. |
| `nombre` | `text` | NOT NULL | Nombre del ejercicio. |
| `descripcion` | `text` | | Instrucciones de ejecución. |
| `url_multimedia`| `text` | | Enlace a video/imagen demostrativa. |
| `parte_cuerpo` | `text` | | Zona a trabajar. |

### 8. `planes_tratamiento`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador del plan. |
| `paciente_id` | `uuid` | FK (`pacientes.id`) | Paciente asignado. |
| `kinesiologo_id`| `uuid` | FK (`kinesiologos.id`) | Profesional que prescribe. |
| `fecha_inicio` | `date` | DEFAULT `CURRENT_DATE` | Inicio del tratamiento. |
| `fecha_fin` | `date` | | Fin estimado del tratamiento. |
| `objetivo_terapeutico`|`text` | | Meta a alcanzar. |

### 9. `plan_detalle`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador del detalle. |
| `plan_id` | `uuid` | FK (`planes_tratamiento.id`) | Plan al que pertenece. |
| `ejercicio_id` | `uuid` | FK (`ejercicios.id`) | Ejercicio asignado. |
| `series` | `integer`| NOT NULL | Cantidad de series. |
| `repeticiones` | `integer`| NOT NULL | Cantidad de repeticiones. |
| `frecuencia_diaria`| `integer`| DEFAULT `1` | Veces a realizar por día. |

### 10. `seguimiento_progreso`
| Columna | Tipo | Restricciones / Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Identificador del seguimiento. |
| `plan_detalle_id`| `uuid` | FK (`plan_detalle.id`) | Detalles del ejercicio completado. |
| `fecha_registro`| `timestamptz` | DEFAULT `now()` | Fecha en que se completó. |
| `completado` | `boolean`| DEFAULT `false` | Indica si efectivamente se realizó. |
| `nivel_dolor` | `integer`| CHECK `>= 1 AND <= 10` | Nivel de dolor entre 1 y 10. |