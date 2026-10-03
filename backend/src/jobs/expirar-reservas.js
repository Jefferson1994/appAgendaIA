// =====================================================
// AGENDA IA
// ETAPA 4.3 - EXPIRACION AUTOMATICA
// =====================================================

const prisma = require('../shared/prisma');

// Revisar cada 60 segundos.
const INTERVALO_REVISION_MS = 60 * 1000;

// Evitar ejecutar dos limpiezas simultaneamente
// dentro del mismo proceso Node.js.
let limpiezaEnCurso = false;

let intervaloActivo = null;


// =====================================================
// EXPIRAR RESERVAS VENCIDAS
// =====================================================

async function expirarReservasVencidas() {

  if (limpiezaEnCurso) {
    return;
  }

  limpiezaEnCurso = true;

  try {

    const ahora = new Date();

    const resultado = await prisma.cita.updateMany({

      where: {

        estado: 'RESERVA_TEMPORAL',

        fechaExpiracionReserva: {
          lte: ahora
        }

      },

      data: {
        estado: 'EXPIRADA'
      }

    });

    if (resultado.count > 0) {

      console.log(
        `[Agenda IA] Reservas expiradas: ${resultado.count}`
      );

    }

    return resultado.count;

  } catch (error) {

    console.error(
      '[Agenda IA] Error expirando reservas:',
      error
    );

  } finally {

    limpiezaEnCurso = false;

  }

}


// =====================================================
// INICIAR LIMPIEZA AUTOMATICA
// =====================================================

function iniciarLimpiezaReservas() {

  // Evita crear varios intervalos por accidente
  // en un mismo proceso.
  if (intervaloActivo) {
    return intervaloActivo;
  }

  console.log(
    '[Agenda IA] Limpieza automatica de reservas iniciada'
  );

  // Revisar al iniciar el backend.
  void expirarReservasVencidas();

  // Continuar revisando cada minuto.
  intervaloActivo = setInterval(() => {

    void expirarReservasVencidas();

  }, INTERVALO_REVISION_MS);

  return intervaloActivo;

}


// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  expirarReservasVencidas,
  iniciarLimpiezaReservas
};