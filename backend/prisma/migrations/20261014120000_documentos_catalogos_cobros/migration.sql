-- CreateEnum
CREATE TYPE "TipoMedioCobro" AS ENUM ('TRANSFERENCIA', 'BILLETERA');

-- AlterTable
ALTER TABLE "organizaciones" ADD COLUMN     "cobro_por_profesional" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "comprobantes_pago" ADD COLUMN     "documento_id" INTEGER;

-- AlterTable
ALTER TABLE "pantallas" ADD COLUMN     "para_todos" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "catalogos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(60) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(250),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalogos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_items" (
    "id" SERIAL NOT NULL,
    "catalogo_id" INTEGER NOT NULL,
    "codigo" VARCHAR(60) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" VARCHAR(250),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalogo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER,
    "tipo_id" INTEGER NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "ruta" VARCHAR(500) NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "subido_por_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medios_cobro" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "profesional_id" INTEGER,
    "tipo" "TipoMedioCobro" NOT NULL,
    "entidad_id" INTEGER NOT NULL,
    "tipo_cuenta_id" INTEGER,
    "numero" VARCHAR(40) NOT NULL,
    "titular" VARCHAR(150) NOT NULL,
    "identificacion_titular" VARCHAR(20),
    "alias" VARCHAR(100),
    "qr_documento_id" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "medios_cobro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalogos_codigo_key" ON "catalogos"("codigo");

-- CreateIndex
CREATE INDEX "catalogo_items_catalogo_id_idx" ON "catalogo_items"("catalogo_id");

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_items_catalogo_id_codigo_key" ON "catalogo_items"("catalogo_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_ruta_key" ON "documentos"("ruta");

-- CreateIndex
CREATE INDEX "documentos_organizacion_id_idx" ON "documentos"("organizacion_id");

-- CreateIndex
CREATE INDEX "documentos_tipo_id_idx" ON "documentos"("tipo_id");

-- CreateIndex
CREATE INDEX "medios_cobro_organizacion_id_profesional_id_idx" ON "medios_cobro"("organizacion_id", "profesional_id");

-- AddForeignKey
ALTER TABLE "comprobantes_pago" ADD CONSTRAINT "comprobantes_pago_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogo_items" ADD CONSTRAINT "catalogo_items_catalogo_id_fkey" FOREIGN KEY ("catalogo_id") REFERENCES "catalogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "catalogo_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_subido_por_id_fkey" FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medios_cobro" ADD CONSTRAINT "medios_cobro_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medios_cobro" ADD CONSTRAINT "medios_cobro_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medios_cobro" ADD CONSTRAINT "medios_cobro_entidad_id_fkey" FOREIGN KEY ("entidad_id") REFERENCES "catalogo_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medios_cobro" ADD CONSTRAINT "medios_cobro_tipo_cuenta_id_fkey" FOREIGN KEY ("tipo_cuenta_id") REFERENCES "catalogo_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medios_cobro" ADD CONSTRAINT "medios_cobro_qr_documento_id_fkey" FOREIGN KEY ("qr_documento_id") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

