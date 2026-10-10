-- AlterTable
ALTER TABLE "permisos" ADD COLUMN     "accion_id" INTEGER;

-- CreateTable
CREATE TABLE "acciones" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "icono" VARCHAR(60),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "requiere_seleccion" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "acciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "acciones_codigo_key" ON "acciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_pantalla_id_accion_id_key" ON "permisos"("pantalla_id", "accion_id");

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_accion_id_fkey" FOREIGN KEY ("accion_id") REFERENCES "acciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

