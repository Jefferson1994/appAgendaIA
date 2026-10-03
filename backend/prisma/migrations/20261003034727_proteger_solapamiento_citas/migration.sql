-- =====================================================
-- AGENDA IA
-- ETAPA 4.2 - PROTECCION DE HORARIOS
-- =====================================================
-- Impide citas superpuestas de un mismo profesional.
-- Mantiene los registros historicos existentes.
-- =====================================================

BEGIN;

-- Permite combinar igualdad de enteros y rangos
-- temporales en una restriccion GiST.

CREATE EXTENSION IF NOT EXISTS btree_gist;


-- La fecha final siempre debe ser posterior
-- a la fecha inicial.

ALTER TABLE public.citas
ADD CONSTRAINT citas_fechas_validas
CHECK (
    fecha_fin > fecha_inicio
);


-- No permitir intervalos superpuestos
-- cuando las citas tengan estados bloqueantes.

ALTER TABLE public.citas
ADD CONSTRAINT citas_sin_solapamiento

EXCLUDE USING gist
(
    profesional_id WITH =,

    tstzrange(
        fecha_inicio,
        fecha_fin,
        '[)'
    ) WITH &&
)

WHERE (
    estado IN (
        'RESERVA_TEMPORAL',
        'PENDIENTE_PAGO',
        'CONFIRMADA'
    )
);

COMMIT;