-- Generado por Oracle SQL Developer Data Modeler 24.3.1.351.0831
--   en:        2026-05-11 23:03:20 CLT
--   sitio:      Oracle Database 21c
--   tipo:      Oracle Database 21c



-- predefined type, no DDL - MDSYS.SDO_GEOMETRY

-- predefined type, no DDL - XMLTYPE

CREATE TABLE "PUBLIC".citas 
    ( 
     id              INTEGER DEFAULT gen_random_uuid()  NOT NULL , 
     paciente_id     INTEGER , 
     kinesiologo_id  INTEGER , 
     fecha           DATE  NOT NULL , 
     hora            DATE  NOT NULL , 
     estado          VARCHAR2 (80) DEFAULT 'agendada' , 
     motivo_consulta VARCHAR2 (30) 
    ) 
    LOGGING 
;

ALTER TABLE "PUBLIC".citas 
    ADD CONSTRAINT citas_PK PRIMARY KEY ( id ) ;

CREATE TABLE "PUBLIC".ejercicios 
    ( 
     id                  INTEGER DEFAULT gen_random_uuid()  NOT NULL , 
     kinesiologo_creador INTEGER , 
     nombre              VARCHAR2 (30)  NOT NULL , 
     descripcion         VARCHAR2 (60) , 
     url_multimedia      VARCHAR2 (100) , 
     parte_cuerpo        VARCHAR2 (30) 
    ) 
    LOGGING 
;

ALTER TABLE "PUBLIC".ejercicios 
    ADD CONSTRAINT ejercicios_PK PRIMARY KEY ( id ) ;

CREATE TABLE "PUBLIC".fichas_clinicas 
    ( 
     id              INTEGER DEFAULT gen_random_uuid()  NOT NULL , 
     paciente_id     INTEGER  NOT NULL , 
     kinesiologo_id  INTEGER , 
     fecha_atencion  TIMESTAMP WITH TIME ZONE DEFAULT now() , 
     diagnostico     VARCHAR2 (100)  NOT NULL , 
     notas_evolucion VARCHAR2 (100) 
    ) 
    LOGGING 
;

ALTER TABLE "PUBLIC".fichas_clinicas 
    ADD CONSTRAINT fichas_clinicas_PK PRIMARY KEY ( id ) ;

ALTER TABLE "PUBLIC".fichas_clinicas 
    ADD CONSTRAINT INDEX_1 UNIQUE ( paciente_id ) ;

CREATE TABLE "PUBLIC".kinesiologos 
    ( 
     id              INTEGER DEFAULT gen_random_uuid()  NOT NULL , 
     usuario_id      INTEGER , 
     nombre_completo VARCHAR2 (50)  NOT NULL , 
     especialidad    VARCHAR2 (30) , 
     registro_minsal VARCHAR2 (40) , 
     clinica_id      CHAR 
--  WARNING: CHAR size not specified 
                     NOT NULL 
    ) 
    LOGGING 
;

ALTER TABLE "PUBLIC".kinesiologos 
    ADD CONSTRAINT kinesiologos_PK PRIMARY KEY ( id ) ;

CREATE TABLE "PUBLIC".pacientes 
    ( 
     id               INTEGER DEFAULT gen_random_uuid()  NOT NULL , 
     usuario_id       INTEGER , 
     rut              VARCHAR2 (30)  NOT NULL , 
     nombre_completo  VARCHAR2 (50)  NOT NULL , 
     fecha_nacimiento DATE , 
     telefono         VARCHAR2 (30) , 
     prevision        VARCHAR2 (30) 
    ) 
    LOGGING 
;

ALTER TABLE "PUBLIC".pacientes 
    ADD CONSTRAINT pacientes_PK PRIMARY KEY ( id ) ;

CREATE TABLE "PUBLIC".plan_detalle 
    ( 
     id                INTEGER DEFAULT gen_random_uuid()  NOT NULL , 
     plan_id           INTEGER , 
     ejercicio_id      INTEGER , 
     series            INTEGER  NOT NULL , 
     repeticiones      INTEGER  NOT NULL , 
     frecuencia_diaria INTEGER DEFAULT 1 
    ) 
    LOGGING 
;

ALTER TABLE "PUBLIC".plan_detalle 
    ADD CONSTRAINT plan_detalle_PK PRIMARY KEY ( id ) ;

CREATE TABLE "PUBLIC".planes_tratamiento 
    ( 
     id                   INTEGER DEFAULT gen_random_uuid()  NOT NULL , 
     paciente_id          INTEGER , 
     kinesiologo_id       INTEGER , 
     fecha_inicio         DATE DEFAULT CURRENT_DATE , 
     fecha_fin            DATE , 
     estado               VARCHAR2 (30) DEFAULT 'activo' , 
     objetivo_terapeutico VARCHAR2 (40) 
    ) 
    LOGGING 
;
CREATE UNIQUE INDEX "PUBLIC".uq_plan_activo_por_paciente ON "PUBLIC".planes_tratamiento 
    ( 
     paciente_id ASC 
    ) 
;

ALTER TABLE "PUBLIC".planes_tratamiento 
    ADD CONSTRAINT planes_tratamiento_PK PRIMARY KEY ( id ) ;

CREATE TABLE "PUBLIC".seguimiento_progreso 
    ( 
     id              INTEGER DEFAULT gen_random_uuid()  NOT NULL , 
     plan_detalle_id INTEGER , 
     fecha_registro  TIMESTAMP WITH TIME ZONE DEFAULT now() , 
     completado      VARCHAR2 (30) , 
     nivel_dolor     INTEGER 
    ) 
    LOGGING 
;

ALTER TABLE "PUBLIC".seguimiento_progreso 
    ADD 
    CHECK (nivel_dolor >= 1 AND nivel_dolor <= 10) 
;

ALTER TABLE "PUBLIC".seguimiento_progreso 
    ADD CONSTRAINT seguimiento_progreso_PK PRIMARY KEY ( id ) ;

CREATE TABLE "PUBLIC".usuarios 
    ( 
     id         INTEGER DEFAULT gen_random_uuid()  NOT NULL , 
     email      VARCHAR2 (30)  NOT NULL , 
     rol        VARCHAR2 (30)  NOT NULL , 
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now() 
    ) 
    LOGGING 
;

ALTER TABLE "PUBLIC".usuarios 
    ADD CONSTRAINT usuarios_PK PRIMARY KEY ( id ) ;

ALTER TABLE "PUBLIC".citas 
    ADD CONSTRAINT citas_FK0 FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES "PUBLIC".pacientes 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".citas 
    ADD CONSTRAINT citas_FK1 FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES "PUBLIC".kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".ejercicios 
    ADD CONSTRAINT ejercicios_FK0 FOREIGN KEY 
    ( 
     kinesiologo_creador
    ) 
    REFERENCES "PUBLIC".kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".fichas_clinicas 
    ADD CONSTRAINT fichas_clinicas_FK0 FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES "PUBLIC".pacientes 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".fichas_clinicas 
    ADD CONSTRAINT fichas_clinicas_FK1 FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES "PUBLIC".kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".kinesiologos 
    ADD CONSTRAINT kinesiologos_FK0 FOREIGN KEY 
    ( 
     usuario_id
    ) 
    REFERENCES "PUBLIC".usuarios 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".pacientes 
    ADD CONSTRAINT pacientes_FK0 FOREIGN KEY 
    ( 
     usuario_id
    ) 
    REFERENCES "PUBLIC".usuarios 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".plan_detalle 
    ADD CONSTRAINT plan_detalle_FK0 FOREIGN KEY 
    ( 
     plan_id
    ) 
    REFERENCES "PUBLIC".planes_tratamiento 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".plan_detalle 
    ADD CONSTRAINT plan_detalle_FK1 FOREIGN KEY 
    ( 
     ejercicio_id
    ) 
    REFERENCES "PUBLIC".ejercicios 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".planes_tratamiento 
    ADD CONSTRAINT planes_tratamiento_FK0 FOREIGN KEY 
    ( 
     paciente_id
    ) 
    REFERENCES "PUBLIC".pacientes 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".planes_tratamiento 
    ADD CONSTRAINT planes_tratamiento_FK1 FOREIGN KEY 
    ( 
     kinesiologo_id
    ) 
    REFERENCES "PUBLIC".kinesiologos 
    ( 
     id
    ) 
    NOT DEFERRABLE 
;

ALTER TABLE "PUBLIC".seguimiento_progreso 
    ADD CONSTRAINT seguimiento_progreso_FK0 FOREIGN KEY 
    ( 
     plan_detalle_id
    ) 
    REFERENCES "PUBLIC".plan_detalle 
    ( 
     id
    ) 
    ON DELETE CASCADE 
    NOT DEFERRABLE 
;



-- Informe de Resumen de Oracle SQL Developer Data Modeler: 
-- 
-- CREATE TABLE                             9
-- CREATE INDEX                             1
-- ALTER TABLE                             23
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
-- WARNINGS                                 1
