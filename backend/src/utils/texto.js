const crypto = require('crypto');
function nombreCompleto(persona) {
  return [persona.nombre, persona.apellido].filter(Boolean).join(' ');
}
function capitalizar(texto) {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
// Código legible y único a partir de un nombre: "Consulta general" -> "consulta-general-3f7298".
function generarCodigo(nombre, maximoBase, porDefecto = 'item') {
  const base = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maximoBase);

  return `${base || porDefecto}-${crypto.randomBytes(3).toString('hex')}`;
}

module.exports = { nombreCompleto, capitalizar, generarCodigo };