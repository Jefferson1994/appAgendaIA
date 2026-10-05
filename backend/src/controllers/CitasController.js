const CitasService = require('../services/CitasService');
const ReservaRequest = require('../dto/request/ReservaRequest');
const ReservaEB = require('../eb/ReservaEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

async function reservar(req, res) {
  const datos = ReservaRequest.validarReserva(req.body);
  const resultado = await CitasService.crearReservaTemporal(datos);

  return ok(
    res,
    new ReservaEB(resultado),
    resultado.creada ? MSG.RESERVA_CREADA : MSG.RESERVA_EXISTENTE,
    resultado.creada ? HTTP.CREADO : HTTP.OK
  );
}

module.exports = { reservar };