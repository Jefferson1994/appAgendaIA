-- AlterTable
ALTER TABLE "organizaciones" ADD COLUMN     "precios_por_profesional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profesionales_crean_servicios" BOOLEAN NOT NULL DEFAULT true;
