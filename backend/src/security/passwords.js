const bcrypt = require('bcryptjs');
const { AUTH } = require('../config/constantes');

function hashear(clave) {
  return bcrypt.hash(clave, AUTH.BCRYPT_RONDAS);
}

function comparar(clave, hash) {
  return bcrypt.compare(clave, hash);
}

module.exports = { hashear, comparar };