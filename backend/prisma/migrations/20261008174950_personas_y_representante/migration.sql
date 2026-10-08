/*
  Warnings:

  - You are about to drop the column `apellido` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `usuarios` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[persona_id]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `persona_id` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoIdentificacion" AS ENUM ('CEDULA', 'PASAPORTE');

-- AlterTable
ALTER TABLE "organizaciones" ADD COLUMN     "representante_id" INTEGER;

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "apellido",
DROP COLUMN "nombre",
DROP COLUMN "telefono",
ADD COLUMN     "persona_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "personas" (
    "id" SERIAL NOT NULL,
    "tipo_identificacion" "TipoIdentificacion",
    "identificacion" VARCHAR(20),
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100),
    "telefono" VARCHAR(30),
    "email" VARCHAR(150),
    "direccion" VARCHAR(300),
    "fecha_nacimiento" DATE,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personas_tipo_identificacion_identificacion_key" ON "personas"("tipo_identificacion", "identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_persona_id_key" ON "usuarios"("persona_id");

-- AddForeignKey
ALTER TABLE "organizaciones" ADD CONSTRAINT "organizaciones_representante_id_fkey" FOREIGN KEY ("representante_id") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
