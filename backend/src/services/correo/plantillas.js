// Plantillas de correo. Cada una devuelve { asunto, texto, html } listos para CorreoService.enviar.

const urlApp = () => process.env.APP_URL || '';

const escapar = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function marco(titulo, parrafos, clave) {
  const cuerpo = parrafos.map((p) => `<p style="margin:0 0 12px">${escapar(p)}</p>`).join('');
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0F2A44">
  <h2 style="margin:0 0 16px">${escapar(titulo)}</h2>
  ${cuerpo}
  <p style="margin:16px 0;padding:12px 16px;background:#F4F6F9;border-radius:8px;font-family:monospace;font-size:18px">${escapar(clave)}</p>
  ${urlApp() ? `<p><a href="${escapar(urlApp())}" style="color:#0F2A44">Ingresar a Agenda IA</a></p>` : ''}
  <p style="margin-top:24px;font-size:12px;color:#64748B">Al ingresar se te pedirá cambiar esta clave temporal.</p>
</div>`;
}

// Usuario nuevo creado por el administrador de su empresa.
function bienvenida({ nombre, empresa, email, clave }) {
  const titulo = `Bienvenido a ${empresa}`;
  const parrafos = [
    `Hola ${nombre}, se creó tu cuenta en Agenda IA.`,
    `Usuario: ${email}`,
    'Tu clave temporal es:'
  ];
  return {
    asunto: titulo,
    texto: `${parrafos.join('\n')}\n${clave}\n\nAl ingresar se te pedirá cambiarla. ${urlApp()}`,
    html: marco(titulo, parrafos, clave)
  };
}

// El administrador restableció la clave de un usuario.
function claveRestablecida({ nombre, clave }) {
  const titulo = 'Tu clave fue restablecida';
  const parrafos = [`Hola ${nombre}, el administrador de tu empresa restableció tu clave.`, 'Tu nueva clave temporal es:'];
  return {
    asunto: titulo,
    texto: `${parrafos.join('\n')}\n${clave}\n\nAl ingresar se te pedirá cambiarla. ${urlApp()}`,
    html: marco(titulo, parrafos, clave)
  };
}

module.exports = { bienvenida, claveRestablecida };
