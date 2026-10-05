const { DateTime } = require('luxon');
const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, ZONA_HORARIA_DEFECTO, TRANSACCION_OPCIONES } = require('../config/constantes');
const { calcularExpiracionReserva, expirarReservasVencidas } = require('../shared/reservas');
const CanalesService = require('./CanalesService');
const DisponibilidadService = require('./DisponibilidadService');
const PacientesRepository = require('../repositories/PacientesRepository');
const ServiciosRepository = require('../repositories/ServiciosRepository');
const CitasRepository = require('../repositories/CitasRepository');
const BloqueosRepository = require('../repositories/BloqueosRepository');

async function crearReservaTemporal({ canalId, clienteId, servicioId, fechaInicio }) {
  if (fechaInicio.toMillis() <= Date.now()) {
    throw new AppError(MSG.FECHA_PASADA, HTTP.PETICION_INVALIDA);
  }

  // En el MVP canal_id viene del cuerpo. En producción debe resolverse desde el
  // número de destino verificado por WhatsApp, nunca desde texto del cliente.
  const canal = await CanalesService.resolverCanalActivo(canalId);
  const { organizacion, profesional } = canal;

  const zonaHoraria = profesional.zonaHoraria || organizacion.zonaHoraria || ZONA_HORARIA_DEFECTO;
  const fechaLocal = fechaInicio.setZone(zonaHoraria).toISODate();

  return prisma.$transaction(async (tx) => {
    // Solo una reserva a la vez por profesional.
    await BloqueosRepository.bloquearProfesional(tx, profesional.id);

    const cliente = await PacientesRepository.buscarActivoPorId(canal.organizacionId, clienteId, tx);
    if (!cliente) {
      throw new AppError(MSG.CLIENTE_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
    }

    const relacion = await ServiciosRepository.buscarPorProfesionalYServicio(profesional.id, servicioId, tx);
    if (!relacion || relacion.servicio.organizacionId !== canal.organizacionId) {
      throw new AppError(MSG.SERVICIO_NO_OFRECIDO, HTTP.NO_ENCONTRADO);
    }

    const ahora = new Date();
    // Expirar bloqueos antiguos antes de volver a ofrecer esos horarios.
    await expirarReservasVencidas(tx, profesional.id);

    // Si el mismo paciente reintenta, se devuelve la reserva vigente.
    const anterior = await CitasRepository.buscarReservaVigente(
      {
        organizacionId: canal.organizacionId,
        profesionalId: profesional.id,
        clienteId,
        servicioId,
        fechaInicio: fechaInicio.toUTC().toJSDate(),
        ahora
      },
      tx
    );
    if (anterior) {
      return { cita: anterior, profesional, servicio: relacion.servicio, zonaHoraria, creada: false };
    }

    // La disponibilidad se consulta dentro de la transacción, después del bloqueo.
    const disponibilidad = await DisponibilidadService.obtenerDisponibilidad({
      profesionalId: profesional.id,
      servicioId,
      desde: fechaLocal,
      dias: 1,
      db: tx
    });

    const seleccionado = disponibilidad.dias
      .flatMap((dia) => dia.horarios)
      .find(
        (horario) =>
          DateTime.fromISO(horario.fechaInicio, { setZone: true }).toMillis() === fechaInicio.toMillis()
      );

    if (!seleccionado) {
      throw new AppError(MSG.HORARIO_NO_DISPONIBLE, HTTP.CONFLICTO);
    }

    const servicio = relacion.servicio;
    const cita = await CitasRepository.crearReservaTemporal(
      {
        organizacionId: canal.organizacionId,
        profesionalId: profesional.id,
        clienteId,
        servicioId,
        fechaInicio: DateTime.fromISO(seleccionado.fechaInicio, { setZone: true }).toUTC().toJSDate(),
        fechaFin: DateTime.fromISO(seleccionado.fechaFin, { setZone: true }).toUTC().toJSDate(),
        precio: relacion.precioPersonalizado ?? servicio.precio,
        duracionMinutos: relacion.duracionPersonalizadaMinutos ?? servicio.duracionMinutos,
        fechaExpiracionReserva: calcularExpiracionReserva(ahora)
      },
      tx
    );

    return { cita, profesional, servicio, zonaHoraria, creada: true };
  }, TRANSACCION_OPCIONES);
}

module.exports = { crearReservaTemporal };