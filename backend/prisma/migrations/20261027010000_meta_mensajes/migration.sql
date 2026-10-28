CREATE TABLE "meta_mensajes" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "numero_id" VARCHAR(40) NOT NULL,
  "canal_id" VARCHAR(150) NOT NULL,
  "remitente" VARCHAR(30) NOT NULL,
  "conversacion" VARCHAR(100) NOT NULL,
  "tipo" VARCHAR(30) NOT NULL,
  "texto" TEXT,
  "medio" JSONB,
  "estado" VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
  "respuesta" TEXT,
  "partes_enviadas" INTEGER NOT NULL DEFAULT 0,
  "ids_salida" JSONB,
  "ultimo_error" VARCHAR(255),
  "lease_hasta" TIMESTAMPTZ(6),
  "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "meta_mensajes_estado_check" CHECK ("estado" IN
    ('PENDIENTE', 'PROCESANDO', 'RESPUESTA_LISTA', 'ENVIANDO', 'ENVIADO', 'ERROR'))
);
CREATE INDEX "meta_mensajes_estado_fecha_creacion_idx" ON "meta_mensajes" ("estado", "fecha_creacion");
CREATE INDEX "meta_mensajes_conversacion_fecha_creacion_idx" ON "meta_mensajes" ("conversacion", "fecha_creacion");
