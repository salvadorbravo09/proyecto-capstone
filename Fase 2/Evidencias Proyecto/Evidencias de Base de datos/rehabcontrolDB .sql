-- Generado por Oracle SQL Developer Data Modeler 24.3.1.351.0831
--   en:        2026-06-13 22:43:45 CLT
--   sitio:      Oracle Database 21c
--   tipo:      Oracle Database 21c



-- predefined type, no DDL - MDSYS.SDO_GEOMETRY

-- predefined type, no DDL - XMLTYPE

CREATE TABLE citas 
    ( 
     id              INTEGER  NOT NULL , 
     paciente_id     INTEGER  NOT NULL , 
     kinesiologo_id  INTEGER  NOT NULL , 
     fecha           DATE  NOT NULL , 
     hora            TIMESTAMP WITH TIME ZONE  NOT NULL , 
     motivo_consulta VARCHAR2 (100) , 
     estado_id       INTEGER 
    ) 
    LOGGING 
;

ALTER TABLE citas 
    ADD CONSTRAINT citas_PK PRIMARY KEY ( id ) ;

CREATE TABLE ejercicios 
    ( 
     id                  INTEGER  NOT NULL , 
     kinesiologo_creador INTEGER , 
     nombre              VARCHAR2 (100)  NOT NULL , 
     descripcion         VARCHAR2 (100) , 
     url_multimedia      VARCHAR2 (100) , 
     parte_cuerpo        VARCHAR2 (100) 
    ) 
    LOGGING 
;

ALTER TABLE ejercicios 
    ADD CONSTRAINT ejercicios_PK PRIMARY KEY ( id ) ;

CREATE TABLE especialidades 
    ( 
     id          INTEGER  NOT NULL , 
     nombre      VARCHAR2 (100)  NOT NULL , 
     descripcion VARCHAR2 (100) 
    ) 
    LOGGING 
;

ALTER TABLE especialidades 
    ADD CONSTRAINT especialidades_PK PRIMARY KEY ( id ) ;

CREATE TABLE estado_historial 
    ( 
     id           INTEGER  NOT NULL , 
     entidad_tipo VARCHAR2 (100)  NOT NULL , 
     entidad_id   INTEGER  NOT NULL , 
     estado_id    INTEGER  NOT NULL , 
     cambio_fecha TIMESTAMP , 
     comentario   VARCHAR2 (100) , 
     actor_id     INTEGER 
    ) 
    LOGGING 
;

ALTER TABLE estado_historial 
    ADD CONSTRAINT estado_historial_PK PRIMARY KEY ( id ) ;

CREATE TABLE estados 
    ( 
     id          INTEGER  NOT NULL , 
     nombre      VARCHAR2 (100)  NOT NULL , 
     entidad     VARCHAR2 (100)  NOT NULL , 
     descripcion VARCHAR2 (100) 
    ) 
    LOGGING 
;

ALTER TABLE estados 
    ADD CONSTRAINT estados_PK PRIMARY KEY ( id ) ;

CREATE TABLE fichas 
    ( 
     id                 INTEGER  NOT NULL , 
     paciente_id        INTEGER  NOT NULL , 
     motivo_tratamiento VARCHAR2 (100) , 
     fecha_inicio       DATE , 
     fecha_cierre       DATE , 
     created_at         TIMESTAMP 
    ) 
    LOGGING 
;

ALTER TABLE fichas 
    ADD CONSTRAINT fichas_PK PRIMARY KEY ( id ) ;

CREATE TABLE fichas_clinicas 
    ( 
     id              INTEGER  NOT NULL , 
     paciente_id     INTEGER  NOT NULL , 
     kinesiologo_id  INTEGER  NOT NULL , 
     fecha_atencion  TIMESTAMP , 
     diagnostico     VARCHAR2 (100)  NOT NULL , 
     notas_evolucion VARCHAR2 (100) 
    ) 
    LOGGING 
;

ALTER TABLE fichas_clinicas 
    ADD CONSTRAINT fichas_clinicas_PK PRIMARY KEY ( id ) ;

CREATE TABLE kinesiologos 
    ( 
     id              INTEGER  NOT NULL , 
     usuario_id      INTEGER , 
     nombre          VARCHAR2 (100)  NOT NULL , 
     apellido        VARCHAR2 (100)  NOT NULL , 
     rut             VARCHAR2 (100) , 
     telefono        VARCHAR2 (100) , 
     registro_minsal VARCHAR2 (100) , 
     especialidad_id INTEGER 
    ) 
    LOGGING 
;

ALTER TABLE kinesiologos 
    ADD CONSTRAINT kinesiologos_PK PRIMARY KEY ( id ) ;

CREATE TABLE notas_evolucion_diaria 
    ( 
     id             INTEGER  NOT NULL , 
     paciente_id    INTEGER  NOT NULL , 
     kinesiologo_id INTEGER  NOT NULL , 
     fecha          DATE  NOT NULL , 
     notas          VARCHAR2 (100)  NOT NULL , 
     created_at     TIMESTAMP , 
     updated_at     TIMESTAMP 
    ) 
    LOGGING 
;

ALTER TABLE notas_evolucion_diaria 
    ADD CONSTRAINT notas_evolucion_diaria_PK PRIMARY KEY ( id ) ;

CREATE TABLE notificaciones 
    ( 
     id             INTEGER  NOT NULL , 
     kinesiologo_id INTEGER , 
     paciente_id    INTEGER , 
     tipo           VARCHAR2 (100) , 
     mensaje        VARCHAR2 (100) , 
     leida          NUMBER , 
     confirmada     NUMBER , 
     created_at     TIMESTAMP 
    ) 
    LOGGING 
;

ALTER TABLE notificaciones 
    ADD CONSTRAINT notificaciones_PK PRIMARY KEY ( id ) ;

CREATE TABLE pacientes 
    ( 
     id                      INTEGER  NOT NULL , 
     usuario_id              INTEGER , 
     nombre                  VARCHAR2 (100) , 
     apellido                VARCHAR2 (100) , 
     rut                     VARCHAR2 (100) , 
     fecha_nacimiento        DATE , 
     telefono                VARCHAR2 (100) , 
     email                   VARCHAR2 (100) , 
     prevision_id            INTEGER , 
     kinesiologo_asignado_id INTEGER , 
     activo                  NUMBER 
    ) 
    LOGGING 
;

ALTER TABLE pacientes 
    ADD CONSTRAINT pacientes_PK PRIMARY KEY ( id ) ;

CREATE TABLE plan_detalle 
    ( 
     id                INTEGER  NOT NULL , 
     plan_id           INTEGER  NOT NULL , 
     ejercicio_id      INTEGER  NOT NULL , 
     series            INTEGER  NOT NULL , 
     repeticiones      INTEGER  NOT NULL , 
     frecuencia_diaria INTEGER  NOT NULL 
    ) 
    LOGGING 
;

ALTER TABLE plan_detalle 
    ADD CONSTRAINT plan_detalle_PK PRIMARY KEY ( id ) ;

CREATE TABLE planes_tratamiento 
    ( 
     id                   INTEGER  NOT NULL , 
     paciente_id          INTEGER  NOT NULL , 
     kinesiologo_id       INTEGER  NOT NULL , 
     fecha_inicio         DATE , 
     fecha_fin            DATE , 
     objetivo_terapeutico VARCHAR2 (100) 
    ) 
    LOGGING 
;

ALTER TABLE planes_tratamiento 
    ADD CONSTRAINT planes_tratamiento_PK PRIMARY KEY ( id ) ;

CREATE TABLE previsiones 
    ( 
     id          INTEGER  NOT NULL , 
     nombre      VARCHAR2 (100)  NOT NULL , 
     descripcion VARCHAR2 (100) 
    ) 
    LOGGING 
;

ALTER TABLE previsiones 
    ADD CONSTRAINT previsiones_PK PRIMARY KEY ( id ) ;

CREATE TABLE seguimiento_progreso 
    ( 
     id              INTEGER  NOT NULL , 
     plan_detalle_id INTEGER  NOT NULL , 
     fecha_registro  TIMESTAMP , 
     completado      NUMBER , 
     nivel_dolor     INTEGER 
    ) 
    LOGGING 
;

ALTER TABLE seguimiento_progreso 
    ADD CONSTRAINT seguimiento_progreso_PK PRIMARY KEY ( id ) ;

CREATE TABLE usuarios 
    ( 
     id         INTEGER  NOT NULL , 
     email      VARCHAR2 (100)  NOT NULL , 
     rol        VARCHAR2 (100)  NOT NULL , 
     created_at TIMESTAMP 
    ) 
    LOGGING 
;

ALTER TABLE usuarios 
    ADD CONSTRAINT usuarios_PK PRIMARY KEY ( id ) ;

ALTER TABLE citas 
    ADD CONSTRAINT fk_citas_estado FOREIGN KEY 
    ( 
     estado_id
    ) 
    REFERENCES estados 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE citas 
    ADD CONSTRAINT fk_citas_kinesiologo FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE citas 
    ADD CONSTRAINT fk_citas_paciente FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE ejercicios 
    ADD CONSTRAINT fk_ejercicios_kinesiologo FOREIGN KEY 
    ( 
     kinesiologo_creador
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE estado_historial 
    ADD CONSTRAINT fk_estado_historial_actor FOREIGN KEY 
    ( 
     actor_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE estado_historial 
    ADD CONSTRAINT fk_estado_historial_estado FOREIGN KEY 
    ( 
     estado_id
    ) 
    REFERENCES estados 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE fichas_clinicas 
    ADD CONSTRAINT fk_fichas_clinicas_kinesiologo FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE fichas_clinicas 
    ADD CONSTRAINT fk_fichas_clinicas_paciente FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE fichas 
    ADD CONSTRAINT fk_fichas_paciente FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE kinesiologos 
    ADD CONSTRAINT fk_kinesiologos_especialidad FOREIGN KEY 
    ( 
     especialidad_id
    ) 
    REFERENCES especialidades 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE kinesiologos 
    ADD CONSTRAINT fk_kinesiologos_usuario FOREIGN KEY 
    ( 
     usuario_id
    ) 
    REFERENCES usuarios 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE notas_evolucion_diaria 
    ADD CONSTRAINT fk_notas_kinesiologo FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE notas_evolucion_diaria 
    ADD CONSTRAINT fk_notas_paciente FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE notificaciones 
    ADD CONSTRAINT fk_notificaciones_kinesiologo FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE notificaciones 
    ADD CONSTRAINT fk_notificaciones_paciente FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE pacientes 
    ADD CONSTRAINT fk_pacientes_kinesiologo FOREIGN KEY 
    ( 
     kinesiologo_asignado_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE pacientes 
    ADD CONSTRAINT fk_pacientes_prevision FOREIGN KEY 
    ( 
     prevision_id
    ) 
    REFERENCES previsiones 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE pacientes 
    ADD CONSTRAINT fk_pacientes_usuario FOREIGN KEY 
    ( 
     usuario_id
    ) 
    REFERENCES usuarios 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE plan_detalle 
    ADD CONSTRAINT fk_plan_detalle_ejercicio FOREIGN KEY 
    ( 
     ejercicio_id
    ) 
    REFERENCES ejercicios 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE plan_detalle 
    ADD CONSTRAINT fk_plan_detalle_plan FOREIGN KEY 
    ( 
     plan_id
    ) 
    REFERENCES planes_tratamiento 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE planes_tratamiento 
    ADD CONSTRAINT fk_planes_kinesiologo FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE planes_tratamiento 
    ADD CONSTRAINT fk_planes_paciente FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE seguimiento_progreso 
    ADD CONSTRAINT fk_seguimiento_plan_detalle FOREIGN KEY 
    ( 
     plan_detalle_id
    ) 
    REFERENCES plan_detalle 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;



-- Informe de Resumen de Oracle SQL Developer Data Modeler: 
-- 
-- CREATE TABLE                            16
-- CREATE INDEX                             0
-- ALTER TABLE                             39
-- CREATE VIEW                              0
-- ALTER VIEW                               0
-- CREATE PACKAGE                           0
-- CREATE PACKAGE BODY                      0
-- CREATE PROCEDURE                         0
-- CREATE FUNCTION                          0
-- CREATE TRIGGER                           0
-- ALTER TRIGGER                            0
-- CREATE COLLECTION TYPE                   0
-- CREATE STRUCTURED TYPE                   0
-- CREATE STRUCTURED TYPE BODY              0
-- CREATE CLUSTER                           0
-- CREATE CONTEXT                           0
-- CREATE DATABASE                          0
-- CREATE DIMENSION                         0
-- CREATE DIRECTORY                         0
-- CREATE DISK GROUP                        0
-- CREATE ROLE                              0
-- CREATE ROLLBACK SEGMENT                  0
-- CREATE SEQUENCE                          0
-- CREATE MATERIALIZED VIEW                 0
-- CREATE MATERIALIZED VIEW LOG             0
-- CREATE SYNONYM                           0
-- CREATE TABLESPACE                        0
-- CREATE USER                              0
-- 
-- DROP TABLESPACE                          0
-- DROP DATABASE                            0
-- 
-- REDACTION POLICY                         0
-- 
-- ORDS DROP SCHEMA                         0
-- ORDS ENABLE SCHEMA                       0
-- ORDS ENABLE OBJECT                       0
-- 
-- ERRORS                                   0
-- WARNINGS                                 0
