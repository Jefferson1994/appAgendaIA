/*
  Warnings:

  - A unique constraint covering the columns `[ruc]` on the table `organizaciones` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "organizaciones" ADD COLUMN     "ciudad" VARCHAR(100),
ADD COLUMN     "descripcion" VARCHAR(500),
ADD COLUMN     "direccion" VARCHAR(300),
ADD COLUMN     "latitud" DECIMAL(9,6),
ADD COLUMN     "logo_url" VARCHAR(500),
ADD COLUMN     "longitud" DECIMAL(9,6),
ADD COLUMN     "moneda" VARCHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN     "pais" VARCHAR(2) NOT NULL DEFAULT 'EC',
ADD COLUMN     "provincia" VARCHAR(100),
ADD COLUMN     "ruc" VARCHAR(13),
ADD COLUMN     "verificada" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "organizaciones_ruc_key" ON "organizaciones"("ruc");
