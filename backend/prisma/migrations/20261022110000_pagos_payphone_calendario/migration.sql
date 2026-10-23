-- Links PayPhone, pagos manuales y sincronización opcional con Google Calendar.
ALTER TYPE "ProveedorPago" ADD VALUE IF NOT EXISTS 'MANUAL';

ALTER TABLE "pagos"
  ADD COLUMN "referencia_solicitud_proveedor" VARCHAR(30);

CREATE UNIQUE INDEX "pagos_referencia_solicitud_proveedor_key"
  ON "pagos"("referencia_solicitud_proveedor");

CREATE TYPE "ProveedorCalendario" AS ENUM ('GOOGLE');
CREATE TYPE "EstadoSincronizacionCalendario" AS ENUM ('PENDIENTE', 'SINCRONIZADO', 'ERROR');

CREATE TABLE "integraciones_calendario" (
  "id" SERIAL NOT NULL,
  "profesional_id" INTEGER NOT NULL,
  "proveedor" "ProveedorCalendario" NOT NULL DEFAULT 'GOOGLE',
  "calendar_id" VARCHAR(255) NOT NULL DEFAULT 'primary',
  "refresh_token_cifrado" TEXT NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "integraciones_calendario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integraciones_calendario_profesional_id_key"
  ON "integraciones_calendario"("profesional_id");

ALTER TABLE "integraciones_calendario"
  ADD CONSTRAINT "integraciones_calendario_profesional_id_fkey"
  FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "eventos_calendario" (
  "id" SERIAL NOT NULL,
  "cita_id" INTEGER NOT NULL,
  "integracion_id" INTEGER NOT NULL,
  "evento_externo_id" VARCHAR(255),
  "estado" "EstadoSincronizacionCalendario" NOT NULL DEFAULT 'PENDIENTE',
  "ultimo_error" TEXT,
  "fecha_sincronizacion" TIMESTAMPTZ(6),
  "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "eventos_calendario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "eventos_calendario_cita_id_key" ON "eventos_calendario"("cita_id");
CREATE UNIQUE INDEX "eventos_calendario_evento_externo_id_key" ON "eventos_calendario"("evento_externo_id");
CREATE INDEX "eventos_calendario_integracion_id_idx" ON "eventos_calendario"("integracion_id");
CREATE INDEX "eventos_calendario_estado_idx" ON "eventos_calendario"("estado");

ALTER TABLE "eventos_calendario"
  ADD CONSTRAINT "eventos_calendario_cita_id_fkey"
  FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "eventos_calendario_integracion_id_fkey"
  FOREIGN KEY ("integracion_id") REFERENCES "integraciones_calendario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
