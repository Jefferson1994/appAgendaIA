-- Agenda IA - Etapa 4.4
-- Solicitudes de cobro por pasarela y coherencia de estados bloqueantes.

BEGIN;

CREATE TYPE "ProveedorPago" AS ENUM ('SIMULADOR', 'PAYPHONE');

ALTER TABLE "pagos"
  ADD COLUMN "referencia_cobro" VARCHAR(80),
  ADD COLUMN "proveedor" "ProveedorPago" NOT NULL DEFAULT 'SIMULADOR',
  ADD COLUMN "referencia_proveedor" VARCHAR(150),
  ADD COLUMN "url_pago" VARCHAR(500),
  ADD COLUMN "moneda" CHAR(3) NOT NULL DEFAULT 'USD',
  ADD COLUMN "porcentaje_anticipo_aplicado" DECIMAL(5,2),
  ADD COLUMN "fecha_expiracion" TIMESTAMPTZ(6);

-- Conserva cualquier pago histórico previo a esta etapa.
UPDATE "pagos"
SET "referencia_cobro" = 'LEGACY-' || "id"::text
WHERE "referencia_cobro" IS NULL;

ALTER TABLE "pagos"
  ALTER COLUMN "referencia_cobro" SET NOT NULL;

CREATE UNIQUE INDEX "pagos_referencia_cobro_key"
  ON "pagos"("referencia_cobro");

CREATE UNIQUE INDEX "pagos_referencia_proveedor_key"
  ON "pagos"("referencia_proveedor");

-- La disponibilidad ya considera ATENDIDA como estado bloqueante. Se alinea
-- la restricción de PostgreSQL para proteger la misma regla al escribir datos.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "citas" a
    INNER JOIN "citas" b
      ON a."profesional_id" = b."profesional_id"
      AND a."id" < b."id"
      AND tstzrange(a."fecha_inicio", a."fecha_fin", '[)')
        && tstzrange(b."fecha_inicio", b."fecha_fin", '[)')
    WHERE a."estado" = 'ATENDIDA'
      AND b."estado" IN ('RESERVA_TEMPORAL', 'PENDIENTE_PAGO', 'CONFIRMADA', 'ATENDIDA')
  ) THEN
    RAISE EXCEPTION 'No se puede proteger ATENDIDA: existen citas superpuestas que deben revisarse primero.';
  END IF;
END $$;

ALTER TABLE "citas" DROP CONSTRAINT "citas_sin_solapamiento";

ALTER TABLE "citas"
ADD CONSTRAINT "citas_sin_solapamiento"
EXCLUDE USING gist
(
  "profesional_id" WITH =,
  tstzrange("fecha_inicio", "fecha_fin", '[)') WITH &&
)
WHERE (
  "estado" IN (
    'RESERVA_TEMPORAL',
    'PENDIENTE_PAGO',
    'CONFIRMADA',
    'ATENDIDA'
  )
);

COMMIT;
