-- CreateTable
CREATE TABLE "servicio_fotos" (
    "id" SERIAL NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "documento_id" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "servicio_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "servicio_fotos_servicio_id_idx" ON "servicio_fotos"("servicio_id");

-- CreateIndex
CREATE UNIQUE INDEX "servicio_fotos_servicio_id_documento_id_key" ON "servicio_fotos"("servicio_id", "documento_id");

-- AddForeignKey
ALTER TABLE "servicio_fotos" ADD CONSTRAINT "servicio_fotos_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_fotos" ADD CONSTRAINT "servicio_fotos_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

