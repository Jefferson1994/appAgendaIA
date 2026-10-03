-- CreateTable
CREATE TABLE "canales_atencion" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "profesional_id" INTEGER NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "identificador" VARCHAR(150) NOT NULL,
    "numero_destino" VARCHAR(30),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canales_atencion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "canales_atencion_identificador_key" ON "canales_atencion"("identificador");

-- CreateIndex
CREATE INDEX "canales_atencion_organizacion_id_activo_idx" ON "canales_atencion"("organizacion_id", "activo");

-- CreateIndex
CREATE INDEX "canales_atencion_profesional_id_activo_idx" ON "canales_atencion"("profesional_id", "activo");

-- AddForeignKey
ALTER TABLE "canales_atencion" ADD CONSTRAINT "canales_atencion_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canales_atencion" ADD CONSTRAINT "canales_atencion_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
