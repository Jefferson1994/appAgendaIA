-- Tipos de recurso: lo que se reserva es una persona (profesional) o una instalación
-- (cancha, mesa, sala). Se guardan en el catálogo genérico y se referencian por id.

-- 1. Catálogo y sus valores (el seed los respeta si ya existen).
INSERT INTO "catalogos" ("codigo", "nombre", "descripcion", "activo", "fecha_actualizacion")
VALUES ('TIPOS_RECURSO', 'Tipos de recurso', 'Qué se reserva: una persona o una instalación', true, CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "catalogo_items" ("catalogo_id", "codigo", "nombre", "orden", "activo", "fecha_actualizacion")
SELECT c."id", v."codigo", v."nombre", v."orden", true, CURRENT_TIMESTAMP
FROM "catalogos" c
CROSS JOIN (VALUES ('PERSONA', 'Persona', 1), ('ESPACIO', 'Instalación', 2)) AS v("codigo", "nombre", "orden")
WHERE c."codigo" = 'TIPOS_RECURSO'
ON CONFLICT ("catalogo_id", "codigo") DO NOTHING;

-- 2. Cada profesional existente es una persona; luego la columna pasa a ser obligatoria.
ALTER TABLE "profesionales" ADD COLUMN "tipo_id" INTEGER;

UPDATE "profesionales"
SET "tipo_id" = (
  SELECT ci."id"
  FROM "catalogo_items" ci
  JOIN "catalogos" c ON c."id" = ci."catalogo_id"
  WHERE c."codigo" = 'TIPOS_RECURSO' AND ci."codigo" = 'PERSONA'
);

ALTER TABLE "profesionales" ALTER COLUMN "tipo_id" SET NOT NULL;

-- 3. Pantallas que solo aplican a un tipo de recurso (Profesionales, Instalaciones).
ALTER TABLE "pantallas" ADD COLUMN "tipo_recurso_id" INTEGER;

-- 4. Fotos de instalaciones y profesionales.
CREATE TABLE "recurso_fotos" (
    "id" SERIAL NOT NULL,
    "profesional_id" INTEGER NOT NULL,
    "documento_id" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recurso_fotos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recurso_fotos_profesional_id_idx" ON "recurso_fotos"("profesional_id");
CREATE UNIQUE INDEX "recurso_fotos_profesional_id_documento_id_key" ON "recurso_fotos"("profesional_id", "documento_id");

ALTER TABLE "profesionales" ADD CONSTRAINT "profesionales_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "catalogo_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurso_fotos" ADD CONSTRAINT "recurso_fotos_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurso_fotos" ADD CONSTRAINT "recurso_fotos_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pantallas" ADD CONSTRAINT "pantallas_tipo_recurso_id_fkey" FOREIGN KEY ("tipo_recurso_id") REFERENCES "catalogo_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
