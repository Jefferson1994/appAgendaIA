-- CreateEnum
CREATE TYPE "TipoReserva" AS ENUM ('PERSONAS', 'ESPACIOS', 'AMBOS');

-- AlterTable
ALTER TABLE "organizaciones" ADD COLUMN     "categoria_id" INTEGER;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "cargo_id" INTEGER,
ADD COLUMN     "cargo_observacion" VARCHAR(250);

-- CreateTable
CREATE TABLE "categorias_empresa" (
    "id" SERIAL NOT NULL,
    "padre_id" INTEGER,
    "codigo" VARCHAR(60) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(250),
    "icono" VARCHAR(60),
    "reserva" "TipoReserva" NOT NULL DEFAULT 'PERSONAS',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categorias_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "codigo" VARCHAR(60) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(250),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_empresa_codigo_key" ON "categorias_empresa"("codigo");

-- CreateIndex
CREATE INDEX "categorias_empresa_padre_id_idx" ON "categorias_empresa"("padre_id");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_codigo_key" ON "cargos"("codigo");

-- CreateIndex
CREATE INDEX "cargos_categoria_id_idx" ON "cargos"("categoria_id");

-- CreateIndex
CREATE INDEX "organizaciones_categoria_id_idx" ON "organizaciones"("categoria_id");

-- AddForeignKey
ALTER TABLE "organizaciones" ADD CONSTRAINT "organizaciones_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_empresa" ADD CONSTRAINT "categorias_empresa_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "categorias_empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

