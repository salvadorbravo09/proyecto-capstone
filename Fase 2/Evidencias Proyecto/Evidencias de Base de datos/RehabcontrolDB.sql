-- Generado por Oracle SQL Developer Data Modeler 24.3.1.351.0831
--   en:        2026-05-27 20:15:17 CLT
--   sitio:      Oracle Database 21c
--   tipo:      Oracle Database 21c



-- predefined type, no DDL - MDSYS.SDO_GEOMETRY

-- predefined type, no DDL - XMLTYPE

CREATE TABLE atenciones 
    ( 
     id                 INTEGER  NOT NULL , 
     ficha_id           INTEGER  NOT NULL , 
     cita_id            INTEGER , 
     kinesiologo_id     INTEGER  NOT NULL , 
     fecha              DATE DEFAULT CURRENT_DATE  NOT NULL , 
     detalle_ejercicios VARCHAR2 (250)  NOT NULL , 
     plan_ejercicios    VARCHAR2 (250)  NOT NULL , 
     created_at         DATE DEFAULT now()  NOT NULL 
    ) 
    LOGGING 
;

ALTER TABLE atenciones 
    ADD CONSTRAINT atenciones_PK PRIMARY KEY ( id ) ;

ALTER TABLE atenciones 
    ADD CONSTRAINT atenciones_cita_id_key UNIQUE ( cita_id ) ;

CREATE TABLE citas 
    ( 
     id              INTEGER  NOT NULL , 
     paciente_id     INTEGER  NOT NULL , 
     kinesiologo_id  INTEGER  NOT NULL , 
     fecha           DATE  NOT NULL , 
     hora            TIMESTAMP WITH TIME ZONE  NOT NULL , 
     motivo_consulta VARCHAR2 (255) , 
     estado_id       INTEGER  NOT NULL 
    ) 
    LOGGING 
;

ALTER TABLE citas 
    ADD CONSTRAINT citas_PK PRIMARY KEY ( id ) ;

CREATE TABLE ejercicios 
    ( 
     id                  INTEGER  NOT NULL , 
     kinesiologo_creador INTEGER , 
     nombre              VARCHAR2 (255)  NOT NULL , 
     descripcion         VARCHAR2 (255) , 
     url_multimedia      VARCHAR2 (255) , 
     parte_cuerpo        VARCHAR2 (255) 
    ) 
    LOGGING 
;

ALTER TABLE ejercicios 
    ADD CONSTRAINT ejercicios_PK PRIMARY KEY ( id ) ;

CREATE TABLE especialidades 
    ( 
     id          INTEGER  NOT NULL , 
     nombre      VARCHAR2 (255)  NOT NULL , 
     descripcion VARCHAR2 (255) 
    ) 
    LOGGING 
;

ALTER TABLE especialidades 
    ADD CONSTRAINT especialidades_PK PRIMARY KEY ( id ) ;

ALTER TABLE especialidades 
    ADD CONSTRAINT especialidades_nombre_key UNIQUE ( nombre ) ;

CREATE TABLE estado_historial 
    ( 
     id           INTEGER  NOT NULL , 
     entidad_tipo VARCHAR2 (255)  NOT NULL , 
     entidad_id   INTEGER  NOT NULL , 
     estado_id    INTEGER  NOT NULL , 
     cambio_fecha DATE DEFAULT now()  NOT NULL , 
     comentario   VARCHAR2 (255)  NOT NULL , 
     actor_id     INTEGER 
    ) 
    LOGGING 
;

ALTER TABLE estado_historial 
    ADD CONSTRAINT estado_historial_PK PRIMARY KEY ( id ) ;

CREATE TABLE estados 
    ( 
     id          INTEGER  NOT NULL , 
     nombre      VARCHAR2 (255)  NOT NULL , 
     entidad     VARCHAR2 (255)  NOT NULL , 
     descripcion VARCHAR2 (255) 
    ) 
    LOGGING 
;

ALTER TABLE estados 
    ADD CONSTRAINT estados_PK PRIMARY KEY ( id ) ;

ALTER TABLE estados 
    ADD CONSTRAINT estados_nombre_entidad_key UNIQUE ( nombre , entidad ) ;

CREATE TABLE fichas 
    ( 
     id                 INTEGER  NOT NULL , 
     paciente_id        INTEGER  NOT NULL , 
     motivo_tratamiento VARCHAR2 (255) , 
     fecha_inicio       DATE DEFAULT CURRENT_DATE  NOT NULL , 
     fecha_cierre       DATE , 
     created_at         DATE DEFAULT now()  NOT NULL 
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
     fecha_atencion  DATE DEFAULT now()  NOT NULL , 
     diagnostico     VARCHAR2 (255)  NOT NULL , 
     notas_evolucion VARCHAR2 (255) 
    ) 
    LOGGING 
;

ALTER TABLE fichas_clinicas 
    ADD CONSTRAINT fichas_clinicas_PK PRIMARY KEY ( id ) ;

CREATE TABLE kinesiologos 
    ( 
     id              INTEGER  NOT NULL , 
     usuario_id      INTEGER , 
     registro_minsal VARCHAR2 (255) , 
     nombre          VARCHAR2 (255)  NOT NULL , 
     apellido        VARCHAR2 (255)  NOT NULL , 
     telefono        VARCHAR2 (255) , 
     rut             VARCHAR2 (255) , 
     especialidad_id INTEGER 
    ) 
    LOGGING 
;

ALTER TABLE kinesiologos 
    ADD CONSTRAINT kinesiologos_PK PRIMARY KEY ( id ) ;

ALTER TABLE kinesiologos 
    ADD CONSTRAINT kinesiologos_registro_minsal_key UNIQUE ( registro_minsal ) ;

ALTER TABLE kinesiologos 
    ADD CONSTRAINT kinesiologos_rut_key UNIQUE ( rut ) ;

ALTER TABLE kinesiologos 
    ADD CONSTRAINT kinesiologos_usuario_id_key UNIQUE ( usuario_id ) ;

CREATE TABLE notificaciones 
    ( 
     id             INTEGER  NOT NULL , 
     kinesiologo_id INTEGER , 
     paciente_id    INTEGER , 
     tipo           VARCHAR2 (255) DEFAULT 'registro_paciente'  NOT NULL , 
     mensaje        VARCHAR2 (255) , 
     leida          NUMBER  NOT NULL , 
     confirmada     NUMBER  NOT NULL , 
     created_at     DATE DEFAULT now()  NOT NULL 
    ) 
    LOGGING 
;

ALTER TABLE notificaciones 
    ADD CONSTRAINT notificaciones_PK PRIMARY KEY ( id ) ;

CREATE TABLE pacientes 
    ( 
     id                      INTEGER  NOT NULL , 
     usuario_id              INTEGER , 
     rut                     VARCHAR2 (255)  NOT NULL , 
     nombre                  VARCHAR2 (255) , 
     fecha_nacimiento        DATE , 
     telefono                VARCHAR2 (255) , 
     apellido                VARCHAR2 (255) , 
     email                   VARCHAR2 (255) , 
     kinesiologo_asignado_id INTEGER , 
     prevision_id            INTEGER 
    ) 
    LOGGING 
;

ALTER TABLE pacientes 
    ADD CONSTRAINT pacientes_PK PRIMARY KEY ( id ) ;

ALTER TABLE pacientes 
    ADD CONSTRAINT pacientes_email_key UNIQUE ( email ) ;

ALTER TABLE pacientes 
    ADD CONSTRAINT pacientes_rut_key UNIQUE ( rut ) ;

ALTER TABLE pacientes 
    ADD CONSTRAINT pacientes_usuario_id_key UNIQUE ( usuario_id ) ;

CREATE TABLE plan_detalle 
    ( 
     id                INTEGER  NOT NULL , 
     plan_id           INTEGER  NOT NULL , 
     ejercicio_id      INTEGER  NOT NULL , 
     series            INTEGER  NOT NULL , 
     repeticiones      INTEGER  NOT NULL , 
     frecuencia_diaria INTEGER DEFAULT 1  NOT NULL 
    ) 
    LOGGING 
;

ALTER TABLE plan_detalle 
    ADD CONSTRAINT plan_detalle_frecuencia_diaria_check 
    CHECK (frecuencia_diaria > 0)
;


ALTER TABLE plan_detalle 
    ADD CONSTRAINT plan_detalle_repeticiones_check 
    CHECK (repeticiones > 0)
;


ALTER TABLE plan_detalle 
    ADD CONSTRAINT plan_detalle_series_check 
    CHECK (series > 0)
;
ALTER TABLE plan_detalle 
    ADD CONSTRAINT plan_detalle_PK PRIMARY KEY ( id ) ;

CREATE TABLE planes_tratamiento 
    ( 
     id                   INTEGER  NOT NULL , 
     paciente_id          INTEGER  NOT NULL , 
     kinesiologo_id       INTEGER  NOT NULL , 
     fecha_inicio         DATE DEFAULT CURRENT_DATE  NOT NULL , 
     fecha_fin            DATE , 
     objetivo_terapeutico VARCHAR2 (255) 
    ) 
    LOGGING 
;

ALTER TABLE planes_tratamiento 
    ADD CONSTRAINT planes_tratamiento_PK PRIMARY KEY ( id ) ;

CREATE TABLE previsiones 
    ( 
     id          INTEGER  NOT NULL , 
     nombre      VARCHAR2 (255)  NOT NULL , 
     descripcion VARCHAR2 (255) 
    ) 
    LOGGING 
;

ALTER TABLE previsiones 
    ADD CONSTRAINT previsiones_PK PRIMARY KEY ( id ) ;

ALTER TABLE previsiones 
    ADD CONSTRAINT previsiones_nombre_key UNIQUE ( nombre ) ;

CREATE TABLE seguimiento_progreso 
    ( 
     id              INTEGER  NOT NULL , 
     plan_detalle_id INTEGER  NOT NULL , 
     fecha_registro  DATE DEFAULT now()  NOT NULL , 
     completado      NUMBER  NOT NULL , 
     nivel_dolor     INTEGER  NOT NULL 
    ) 
    LOGGING 
;

ALTER TABLE seguimiento_progreso 
    ADD CONSTRAINT seguimiento_progreso_nivel_dolor_check 
    CHECK (nivel_dolor >= 1 AND nivel_dolor <= 10)
;
ALTER TABLE seguimiento_progreso 
    ADD CONSTRAINT seguimiento_progreso_PK PRIMARY KEY ( id ) ;

CREATE TABLE usuarios 
    ( 
     id         INTEGER  NOT NULL , 
     email      VARCHAR2 (255)  NOT NULL , 
     rol        VARCHAR2 (255) DEFAULT 'paciente'  NOT NULL , 
     created_at DATE DEFAULT now()  NOT NULL 
    ) 
    LOGGING 
;

ALTER TABLE usuarios 
    ADD CONSTRAINT usuarios_PK PRIMARY KEY ( id ) ;

ALTER TABLE usuarios 
    ADD CONSTRAINT usuarios_email_key UNIQUE ( email ) ;

ALTER TABLE atenciones 
    ADD CONSTRAINT atenciones_cita_id_fkey FOREIGN KEY 
    ( 
     cita_id
    ) 
    REFERENCES citas 
    ( 
     id
    ) 
    ON DELETE SET NULL 
    NOT DEFERRABLE 
;

ALTER TABLE atenciones 
    ADD CONSTRAINT atenciones_ficha_id_fkey FOREIGN KEY 
    ( 
     ficha_id
    ) 
    REFERENCES fichas 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE atenciones 
    ADD CONSTRAINT atenciones_kinesiologo_id_fkey FOREIGN KEY 
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
    ADD CONSTRAINT citas_estado_id_fkey FOREIGN KEY 
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
    ADD CONSTRAINT citas_kinesiologo_id_fkey FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE citas 
    ADD CONSTRAINT citas_paciente_id_fkey FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE ejercicios 
    ADD CONSTRAINT ejercicios_kinesiologo_creador_fkey FOREIGN KEY 
    ( 
     kinesiologo_creador
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    ON DELETE SET NULL 
    NOT DEFERRABLE 
;

ALTER TABLE estado_historial 
    ADD CONSTRAINT estado_historial_actor_id_fkey FOREIGN KEY 
    ( 
     actor_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    ON DELETE SET NULL 
    NOT DEFERRABLE 
;

ALTER TABLE estado_historial 
    ADD CONSTRAINT estado_historial_estado_id_fkey FOREIGN KEY 
    ( 
     estado_id
    ) 
    REFERENCES estados 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE fichas_clinicas 
    ADD CONSTRAINT fichas_clinicas_kinesiologo_id_fkey FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE fichas_clinicas 
    ADD CONSTRAINT fichas_clinicas_paciente_id_fkey FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE fichas 
    ADD CONSTRAINT fichas_paciente_id_fkey FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE kinesiologos 
    ADD CONSTRAINT kinesiologos_especialidad_id_fkey FOREIGN KEY 
    ( 
     especialidad_id
    ) 
    REFERENCES especialidades 
    ( 
     id
    ) 
    ON DELETE SET NULL 
    NOT DEFERRABLE 
;

ALTER TABLE kinesiologos 
    ADD CONSTRAINT kinesiologos_usuario_id_fkey FOREIGN KEY 
    ( 
     usuario_id
    ) 
    REFERENCES usuarios 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE notificaciones 
    ADD CONSTRAINT notificaciones_kinesiologo_id_fkey FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE notificaciones 
    ADD CONSTRAINT notificaciones_paciente_id_fkey FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE pacientes 
    ADD CONSTRAINT pacientes_kinesiologo_asignado_id_fkey FOREIGN KEY 
    ( 
     kinesiologo_asignado_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    ON DELETE SET NULL 
    NOT DEFERRABLE 
;

ALTER TABLE pacientes 
    ADD CONSTRAINT pacientes_prevision_id_fkey FOREIGN KEY 
    ( 
     prevision_id
    ) 
    REFERENCES previsiones 
    ( 
     id
    ) 
    ON DELETE SET NULL 
    NOT DEFERRABLE 
;

ALTER TABLE pacientes 
    ADD CONSTRAINT pacientes_usuario_id_fkey FOREIGN KEY 
    ( 
     usuario_id
    ) 
    REFERENCES usuarios 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE plan_detalle 
    ADD CONSTRAINT plan_detalle_ejercicio_id_fkey FOREIGN KEY 
    ( 
     ejercicio_id
    ) 
    REFERENCES ejercicios 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE plan_detalle 
    ADD CONSTRAINT plan_detalle_plan_id_fkey FOREIGN KEY 
    ( 
     plan_id
    ) 
    REFERENCES planes_tratamiento 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE planes_tratamiento 
    ADD CONSTRAINT planes_tratamiento_kinesiologo_id_fkey FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES kinesiologos 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE planes_tratamiento 
    ADD CONSTRAINT planes_tratamiento_paciente_id_fkey FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES pacientes 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE seguimiento_progreso 
    ADD CONSTRAINT seguimiento_progreso_plan_detalle_id_fkey FOREIGN KEY 
    ( 
     plan_detalle_id
    ) 
    REFERENCES plan_detalle 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;



-- Informe de Resumen de Oracle SQL Developer Data Modeler: 
-- 
-- CREATE TABLE                            16
-- CREATE INDEX                             0
-- ALTER TABLE                             55
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
