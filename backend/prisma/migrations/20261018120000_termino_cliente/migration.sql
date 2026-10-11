-- Cómo llama cada negocio a quienes reservan (Pacientes en salud, Clientes en el resto).
ALTER TABLE "categorias_empresa" ADD COLUMN "termino_cliente" VARCHAR(40);

-- Pantallas cuyo nombre en el menú es ese término.
ALTER TABLE "pantallas" ADD COLUMN "nombre_por_negocio" BOOLEAN NOT NULL DEFAULT false;

-- Datos existentes: salud llama "Pacientes" a sus clientes; la lista de clientes toma ese nombre.
UPDATE "categorias_empresa" SET "termino_cliente" = 'Pacientes' WHERE "codigo" = 'SALUD' AND "termino_cliente" IS NULL;
UPDATE "pantallas" SET "nombre_por_negocio" = true, "nombre" = 'Clientes' WHERE "codigo" = 'PACIENTES_LISTA';
UPDATE "modulos" SET "nombre" = 'Clientes' WHERE "codigo" = 'PACIENTES';
