const crypto = require('crypto');

function clave() {
  const secreto = process.env.CIFRADO_SECRET || process.env.JWT_SECRET;
  if (!secreto) throw new Error('Configura CIFRADO_SECRET para proteger integraciones externas');
  return crypto.createHash('sha256').update(secreto).digest();
}

function cifrar(texto) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', clave(), iv);
  const contenido = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, contenido].map((dato) => dato.toString('base64url')).join('.');
}

function descifrar(valor) {
  const [ivTexto, tagTexto, contenidoTexto] = String(valor || '').split('.');
  if (!ivTexto || !tagTexto || !contenidoTexto) throw new Error('El token de calendario almacenado no es válido');
  const decipher = crypto.createDecipheriv('aes-256-gcm', clave(), Buffer.from(ivTexto, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagTexto, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(contenidoTexto, 'base64url')), decipher.final()]).toString('utf8');
}

module.exports = { cifrar, descifrar };
