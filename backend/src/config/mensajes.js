module.exports = {
  // Genéricos
  ERROR_GENERICO: 'Ocurrió un error',
  ERROR_INTERNO: 'Error interno del servidor',
  JSON_INVALIDO: 'El cuerpo de la petición no es un JSON válido',
  REGISTRO_DUPLICADO: 'Ya existe un registro con esos datos',
  REGISTRO_NO_ENCONTRADO: 'El registro solicitado no existe',
  ID_INVALIDO: (campo) => `${campo} debe ser un entero positivo`,
  DATO_INVALIDO: (campo) => `${campo} no es válido`,
  CAMPO_OBLIGATORIO: (campo) => `${campo} es obligatorio`,

  // Clientes y organización
  ORGANIZACION_NO_ENCONTRADA: 'Organización no encontrada',
  CLIENTES_OK: 'Clientes obtenidos correctamente',
  CLIENTE_REGISTRADO: 'Cliente registrado correctamente',
  CLIENTE_EXISTENTE: 'El cliente ya estaba registrado',
  CLIENTE_NO_ENCONTRADO: 'Cliente no encontrado en esta organización',

  // Profesionales y servicios
  PROFESIONAL_NO_ENCONTRADO: 'Profesional no encontrado',
  SERVICIO_NO_OFRECIDO: 'El profesional no ofrece ese servicio',
  SERVICIOS_OK: 'Servicios obtenidos correctamente',

  // Disponibilidad
  FECHA_DESDE_INVALIDA: 'La fecha desde no es válida',
  DISPONIBILIDAD_OK: 'Disponibilidad obtenida correctamente',

  // Canal
  CANAL_NO_ENCONTRADO: 'Canal de atención no encontrado',
  CANAL_NO_DISPONIBLE: 'Canal de atención no disponible',
  CANAL_INACTIVO: 'El canal de atención está inactivo',
  ORGANIZACION_INACTIVA: 'La organización asociada al canal está inactiva',
  PROFESIONAL_INACTIVO: 'El profesional asociado al canal está inactivo',

  // Reservas
  FECHA_INICIO_SIN_ZONA: 'fecha_inicio debe ser ISO 8601 y contener zona horaria',
  FECHA_PASADA: 'El horario debe ser futuro',
  HORARIO_NO_DISPONIBLE: 'Ese horario ya no está disponible. Consulta otro horario.',
  RESERVA_CREADA: 'Reserva temporal creada. Aún no es una cita confirmada.',
  RESERVA_EXISTENTE: 'Ya existe una reserva temporal vigente para ese horario.',

  // Pagos
  MONTO_INVALIDO: 'monto debe ser un número positivo',
  PAGO_PREVIO_NO_REQUERIDO: 'Este servicio no requiere pago previo',
  CITA_NO_ENCONTRADA: 'Reserva no encontrada para este canal',
  CITA_YA_CONFIRMADA: 'La cita ya está confirmada',
  RESERVA_EXPIRADA: 'La reserva temporal ya expiró',
  CITA_NO_PUEDE_PAGAR: 'La cita no puede iniciar un pago',
  REFERENCIA_NO_ENCONTRADA: 'La referencia de cobro no existe',
  PAGO_CREADO: 'Solicitud de pago creada en modo simulador.',
  PAGO_EXISTENTE: 'Ya existe una solicitud de pago vigente para esta reserva.',

  // Webhook del simulador
  SIMULADOR_NO_DISPONIBLE: 'El simulador de pagos no está disponible en producción',
  SIMULADOR_SIN_CONFIGURAR: 'Configura PAGO_SIMULADOR_SECRETO para usar el simulador',
  WEBHOOK_NO_AUTORIZADO: 'El secreto del simulador no es válido',
  SERVICIO_OK: 'Servicio obtenido correctamente',
  CONTEXTO_OK: 'Contexto del canal obtenido correctamente',
  FECHA_INICIO_INVALIDA: 'fecha_inicio no es válida',
  OBSERVACION_PAGO_CONFIRMADO: 'Pago confirmado por el simulador local.',
  OBSERVACION_MONTO_DISTINTO: 'El monto recibido no coincide con el monto esperado.',
  EVENTO_PAGO_PROCESADO: 'Evento de pago procesado',
};