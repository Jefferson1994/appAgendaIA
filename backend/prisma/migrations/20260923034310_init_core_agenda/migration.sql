-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "TipoExcepcionHorario" AS ENUM ('BLOQUEO', 'DISPONIBILIDAD_EXTRA');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('RESERVA_TEMPORAL', 'PENDIENTE_PAGO', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TRANSFERENCIA', 'EFECTIVO', 'PASARELA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'COMPROBANTE_RECIBIDO', 'EN_CONCILIACION', 'CONFIRMADO', 'RECHAZADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "EstadoProcesamientoComprobante" AS ENUM ('RECIBIDO', 'PROCESADO', 'ERROR');

-- CreateEnum
CREATE TYPE "OrigenTransaccionBancaria" AS ENUM ('EMAIL', 'API', 'PASARELA', 'MANUAL');

-- CreateEnum
CREATE TYPE "EstadoConciliacion" AS ENUM ('PENDIENTE', 'COINCIDENCIA_AUTOMATICA', 'REVISION_MANUAL', 'APROBADA_MANUALMENTE', 'RECHAZADA');

-- CreateTable
CREATE TABLE "organizaciones" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "nombre_comercial" VARCHAR(150),
    "telefono" VARCHAR(30),
    "email" VARCHAR(150),
    "zona_horaria" VARCHAR(80) NOT NULL DEFAULT 'America/Guayaquil',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profesionales" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100),
    "telefono" VARCHAR(30),
    "email" VARCHAR(150),
    "tipo_profesional" VARCHAR(100),
    "descripcion" TEXT,
    "zona_horaria" VARCHAR(80),
    "intervalo_agenda_minutos" INTEGER NOT NULL DEFAULT 30,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profesionales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100),
    "telefono" VARCHAR(30) NOT NULL,
    "email" VARCHAR(150),
    "direccion" VARCHAR(300),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,
    "requiere_pago_previo" BOOLEAN NOT NULL DEFAULT false,
    "porcentaje_anticipo" DECIMAL(5,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profesionales_servicios" (
    "id" SERIAL NOT NULL,
    "profesional_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "precio_personalizado" DECIMAL(10,2),
    "duracion_personalizada_minutos" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "profesionales_servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_profesional" (
    "id" SERIAL NOT NULL,
    "profesional_id" INTEGER NOT NULL,
    "dia_semana" "DiaSemana" NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_fin" TIME(0) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "horarios_profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excepciones_horario" (
    "id" SERIAL NOT NULL,
    "profesional_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(0),
    "hora_fin" TIME(0),
    "dia_completo" BOOLEAN NOT NULL DEFAULT false,
    "tipo" "TipoExcepcionHorario" NOT NULL,
    "motivo" VARCHAR(250),

    CONSTRAINT "excepciones_horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "profesional_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL,
    "fecha_fin" TIMESTAMPTZ(6) NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'RESERVA_TEMPORAL',
    "fecha_expiracion_reserva" TIMESTAMPTZ(6),
    "notas_cliente" TEXT,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "cita_id" INTEGER NOT NULL,
    "monto_esperado" DECIMAL(10,2) NOT NULL,
    "monto_recibido" DECIMAL(10,2),
    "metodo" "MetodoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "referencia_bancaria" VARCHAR(150),
    "fecha_pago" TIMESTAMPTZ(6),
    "fecha_confirmacion" TIMESTAMPTZ(6),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobantes_pago" (
    "id" SERIAL NOT NULL,
    "pago_id" INTEGER NOT NULL,
    "archivo_url" VARCHAR(500) NOT NULL,
    "hash_archivo" VARCHAR(150),
    "monto_detectado" DECIMAL(10,2),
    "fecha_detectada" TIMESTAMPTZ(6),
    "referencia_detectada" VARCHAR(150),
    "banco_detectado" VARCHAR(150),
    "nombre_detectado" VARCHAR(200),
    "estado_procesamiento" "EstadoProcesamientoComprobante" NOT NULL DEFAULT 'RECIBIDO',
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprobantes_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones_bancarias" (
    "id" SERIAL NOT NULL,
    "organizacion_id" INTEGER NOT NULL,
    "banco" VARCHAR(150) NOT NULL,
    "cuenta_destino" VARCHAR(100),
    "referencia" VARCHAR(150),
    "monto" DECIMAL(10,2) NOT NULL,
    "ordenante" VARCHAR(200),
    "fecha_transaccion" TIMESTAMPTZ(6),
    "fecha_recepcion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origen" "OrigenTransaccionBancaria" NOT NULL,
    "hash_evento" VARCHAR(150),
    "payload_raw" JSONB,

    CONSTRAINT "transacciones_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliaciones_pago" (
    "id" SERIAL NOT NULL,
    "pago_id" INTEGER NOT NULL,
    "transaccion_bancaria_id" INTEGER NOT NULL,
    "puntaje_coincidencia" DECIMAL(5,2) NOT NULL,
    "coincide_monto" BOOLEAN NOT NULL DEFAULT false,
    "coincide_referencia" BOOLEAN NOT NULL DEFAULT false,
    "coincide_fecha" BOOLEAN NOT NULL DEFAULT false,
    "coincide_cuenta" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoConciliacion" NOT NULL DEFAULT 'PENDIENTE',
    "observacion" TEXT,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conciliaciones_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizaciones_codigo_key" ON "organizaciones"("codigo");

-- CreateIndex
CREATE INDEX "profesionales_organizacion_id_idx" ON "profesionales"("organizacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "profesionales_organizacion_id_codigo_key" ON "profesionales"("organizacion_id", "codigo");

-- CreateIndex
CREATE INDEX "clientes_organizacion_id_idx" ON "clientes"("organizacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_organizacion_id_telefono_key" ON "clientes"("organizacion_id", "telefono");

-- CreateIndex
CREATE INDEX "servicios_organizacion_id_idx" ON "servicios"("organizacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_organizacion_id_codigo_key" ON "servicios"("organizacion_id", "codigo");

-- CreateIndex
CREATE INDEX "profesionales_servicios_servicio_id_idx" ON "profesionales_servicios"("servicio_id");

-- CreateIndex
CREATE UNIQUE INDEX "profesionales_servicios_profesional_id_servicio_id_key" ON "profesionales_servicios"("profesional_id", "servicio_id");

-- CreateIndex
CREATE INDEX "horarios_profesional_profesional_id_dia_semana_idx" ON "horarios_profesional"("profesional_id", "dia_semana");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_profesional_profesional_id_dia_semana_hora_inicio__key" ON "horarios_profesional"("profesional_id", "dia_semana", "hora_inicio", "hora_fin");

-- CreateIndex
CREATE INDEX "excepciones_horario_profesional_id_fecha_idx" ON "excepciones_horario"("profesional_id", "fecha");

-- CreateIndex
CREATE INDEX "citas_profesional_id_fecha_inicio_fecha_fin_idx" ON "citas"("profesional_id", "fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "citas_cliente_id_fecha_inicio_idx" ON "citas"("cliente_id", "fecha_inicio");

-- CreateIndex
CREATE INDEX "citas_estado_idx" ON "citas"("estado");

-- CreateIndex
CREATE INDEX "citas_fecha_expiracion_reserva_idx" ON "citas"("fecha_expiracion_reserva");

-- CreateIndex
CREATE INDEX "pagos_cita_id_idx" ON "pagos"("cita_id");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_pago_hash_archivo_key" ON "comprobantes_pago"("hash_archivo");

-- CreateIndex
CREATE INDEX "comprobantes_pago_pago_id_idx" ON "comprobantes_pago"("pago_id");

-- CreateIndex
CREATE UNIQUE INDEX "transacciones_bancarias_hash_evento_key" ON "transacciones_bancarias"("hash_evento");

-- CreateIndex
CREATE INDEX "transacciones_bancarias_organizacion_id_fecha_transaccion_idx" ON "transacciones_bancarias"("organizacion_id", "fecha_transaccion");

-- CreateIndex
CREATE INDEX "transacciones_bancarias_referencia_idx" ON "transacciones_bancarias"("referencia");

-- CreateIndex
CREATE INDEX "conciliaciones_pago_estado_idx" ON "conciliaciones_pago"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "conciliaciones_pago_pago_id_transaccion_bancaria_id_key" ON "conciliaciones_pago"("pago_id", "transaccion_bancaria_id");

-- AddForeignKey
ALTER TABLE "profesionales" ADD CONSTRAINT "profesionales_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesionales_servicios" ADD CONSTRAINT "profesionales_servicios_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesionales_servicios" ADD CONSTRAINT "profesionales_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_profesional" ADD CONSTRAINT "horarios_profesional_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excepciones_horario" ADD CONSTRAINT "excepciones_horario_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes_pago" ADD CONSTRAINT "comprobantes_pago_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_bancarias" ADD CONSTRAINT "transacciones_bancarias_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones_pago" ADD CONSTRAINT "conciliaciones_pago_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones_pago" ADD CONSTRAINT "conciliaciones_pago_transaccion_bancaria_id_fkey" FOREIGN KEY ("transaccion_bancaria_id") REFERENCES "transacciones_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
