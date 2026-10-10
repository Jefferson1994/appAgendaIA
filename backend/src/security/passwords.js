const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { AUTH } = require('../config/constantes');

// Sin caracteres que se confunden al copiarlos a mano (0/O, 1/l/I).
const ALFABETO_CLAVE = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function hashear(clave) {
  return bcrypt.hash(clave, AUTH.BCRYPT_RONDAS);
}

function comparar(clave, hash) {
  return bcrypt.compare(clave, hash);
}

// Clave temporal aleatoria para usuarios nuevos o restablecidos.
function generarClaveTemporal(largo = AUTH.CLAVE_TEMPORAL_LARGO) {
  return Array.from(crypto.randomBytes(largo), (byte) => ALFABETO_CLAVE[byte % ALFABETO_CLAVE.length]).join('');
}

module.exports = { hashear, comparar, generarClaveTemporal };
