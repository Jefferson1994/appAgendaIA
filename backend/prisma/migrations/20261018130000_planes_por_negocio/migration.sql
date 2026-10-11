-- Planes por tipo de negocio: una clínica no contrata los mismos módulos que una cancha.
-- null = el plan se ofrece a todos los negocios (los planes que ya existen quedan así).
ALTER TABLE "planes" ADD COLUMN "categoria_id" INTEGER;

CREATE INDEX "planes_categoria_id_idx" ON "planes"("categoria_id");

ALTER TABLE "planes" ADD CONSTRAINT "planes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
