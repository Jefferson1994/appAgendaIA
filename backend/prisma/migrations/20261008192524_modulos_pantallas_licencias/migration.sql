-- AlterTable
ALTER TABLE "permisos" ADD COLUMN     "pantalla_id" INTEGER;

-- CreateTable
CREATE TABLE "modulos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(60) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(250),
    "icono" VARCHAR(60),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "es_base" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pantallas" (
    "id" SERIAL NOT NULL,
    "modulo_id" INTEGER NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "ruta" VARCHAR(150) NOT NULL,
    "icono" VARCHAR(60),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pantallas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizaciones_modulos" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "modulo_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMPTZ(6),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizaciones_modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_pantallas" (
    "rol_id" INTEGER NOT NULL,
    "pantalla_id" INTEGER NOT NULL,

    CONSTRAINT "roles_pantallas_pkey" PRIMARY KEY ("rol_id","pantalla_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modulos_codigo_key" ON "modulos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pantallas_codigo_key" ON "pantallas"("codigo");

-- CreateIndex
CREATE INDEX "pantallas_modulo_id_idx" ON "pantallas"("modulo_id");

-- CreateIndex
CREATE INDEX "organizaciones_modulos_modulo_id_idx" ON "organizaciones_modulos"("modulo_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizaciones_modulos_organizacion_id_modulo_id_key" ON "organizaciones_modulos"("organizacion_id", "modulo_id");

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_pantalla_id_fkey" FOREIGN KEY ("pantalla_id") REFERENCES "pantallas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pantallas" ADD CONSTRAINT "pantallas_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizaciones_modulos" ADD CONSTRAINT "organizaciones_modulos_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizaciones_modulos" ADD CONSTRAINT "organizaciones_modulos_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_pantallas" ADD CONSTRAINT "roles_pantallas_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_pantallas" ADD CONSTRAINT "roles_pantallas_pantalla_id_fkey" FOREIGN KEY ("pantalla_id") REFERENCES "pantallas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
