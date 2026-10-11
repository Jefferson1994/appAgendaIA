-- AlterTable
ALTER TABLE "catalogo_items" ADD COLUMN     "color" VARCHAR(7);

-- CreateTable
CREATE TABLE "horarios_organizacion" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "dia_semana" "DiaSemana" NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_fin" TIME(0) NOT NULL,

    CONSTRAINT "horarios_organizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horarios_organizacion_organizacion_id_idx" ON "horarios_organizacion"("organizacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_organizacion_organizacion_id_dia_semana_hora_inici_key" ON "horarios_organizacion"("organizacion_id", "dia_semana", "hora_inicio", "hora_fin");

-- AddForeignKey
ALTER TABLE "horarios_organizacion" ADD CONSTRAINT "horarios_organizacion_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

