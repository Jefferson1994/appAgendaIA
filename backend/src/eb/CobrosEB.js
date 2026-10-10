const { nombreCompleto } = require('../utils/texto');

const aOpcion = (item) => ({ Id: item.id, Nombre: item.nombre });

// Un medio de cobro (cuenta bancaria o billetera) tal como lo ven la empresa y el profesional.
class MedioCobroEB {
  constructor(medio) {
    this.Id = medio.id;
    this.Tipo = medio.tipo;
    this.Entidad = aOpcion(medio.entidad);
    this.TipoCuenta = medio.tipoCuenta ? aOpcion(medio.tipoCuenta) : null;
    this.Numero = medio.numero;
    this.Titular = medio.titular;
    this.IdentificacionTitular = medio.identificacionTitular || null;
    this.Alias = medio.alias || null;
    this.QrDocumentoId = medio.qrDocumentoId || null;
    this.Orden = medio.orden;
    this.Activo = medio.activo;
    this.Profesional = medio.profesional ? { Id: medio.profesional.id, Nombre: nombreCompleto(medio.profesional) } : null;
  }
}

const aOpciones = ({ bancos, billeteras, tiposCuenta }) => ({
  Bancos: bancos.map(aOpcion),
  Billeteras: billeteras.map(aOpcion),
  TiposCuenta: tiposCuenta.map(aOpcion)
});

// Respuesta de POST /cobros/consultar (administrador): política, cuentas de la empresa
// y las de cada profesional (solo lectura).
class CobrosEmpresaEB {
  constructor({ cobroPorProfesional, medios, mediosProfesionales, opciones }) {
    this.CobroPorProfesional = cobroPorProfesional;
    this.Medios = medios.map((medio) => new MedioCobroEB(medio));
    this.MediosProfesionales = mediosProfesionales.map((medio) => new MedioCobroEB(medio));
    this.Opciones = aOpciones(opciones);
  }
}

// Respuesta de POST /cobros/mios/consultar (profesional): sus propias cuentas.
class MisCobrosEB {
  constructor({ cobroPorProfesional, medios, opciones }) {
    this.CobroPorProfesional = cobroPorProfesional;
    this.Medios = medios.map((medio) => new MedioCobroEB(medio));
    this.Opciones = aOpciones(opciones);
  }
}

module.exports = { MedioCobroEB, CobrosEmpresaEB, MisCobrosEB };
