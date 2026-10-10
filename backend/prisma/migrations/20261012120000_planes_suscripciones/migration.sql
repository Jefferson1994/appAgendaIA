-- CreateEnum
CREATE TYPE "Periodicidad" AS ENUM ('MENSUAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('PENDIENTE_PAGO', 'VIGENTE', 'FINALIZADA');

-- AlterTable
ALTER TABLE "modulos" ADD COLUMN     "moneda" VARCHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN     "periodicidad" "Periodicidad" NOT NULL DEFAULT 'MENSUAL',
ADD COLUMN     "precio" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "organizaciones_modulos" ADD COLUMN     "moneda" VARCHAR(3),
ADD COLUMN     "periodicidad" "Periodicidad",
ADD COLUMN     "precio" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "planes" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(500),
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "periodicidad" "Periodicidad" NOT NULL DEFAULT 'MENSUAL',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_modulos" (
    "plan_id" INTEGER NOT NULL,
    "modulo_id" INTEGER NOT NULL,

    CONSTRAINT "planes_modulos_pkey" PRIMARY KEY ("plan_id","modulo_id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL,
    "periodicidad" "Periodicidad" NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMPTZ(6),
    "proveedor_pago" VARCHAR(30),
    "referencia_pago" VARCHAR(120),
    "fecha_pago" TIMESTAMPTZ(6),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "planes_codigo_key" ON "planes"("codigo");

-- CreateIndex
CREATE INDEX "planes_modulos_modulo_id_idx" ON "planes_modulos"("modulo_id");

-- CreateIndex
CREATE INDEX "suscripciones_organizacion_id_estado_idx" ON "suscripciones"("organizacion_id", "estado");

-- AddForeignKey
ALTER TABLE "planes_modulos" ADD CONSTRAINT "planes_modulos_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_modulos" ADD CONSTRAINT "planes_modulos_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

