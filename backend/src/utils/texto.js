function nombreCompleto(persona) {
  return [persona.nombre, persona.apellido].filter(Boolean).join(' ');
}
function capitalizar(texto) {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
module.exports = { nombreCompleto, capitalizar };