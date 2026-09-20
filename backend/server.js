const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.txt');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, '');
}

// --- Servicio de Leads (pacientes que escriben) ---

function leerLeads() {
  const contenido = fs.readFileSync(LEADS_FILE, 'utf-8');
  return contenido
    .split('\n')
    .filter((linea) => linea.trim() !== '')
    .map((linea) => {
      const partes = Object.fromEntries(
        linea.split(' | ').map((par) => {
          const [clave, ...resto] = par.split(': ');
          return [clave.trim(), resto.join(': ').trim()];
        })
      );
      return partes;
    });
}

// Registrar o reconocer un lead (paciente)
app.post('/leads', (req, res) => {
  const { nombre, telefono, direccion } = req.body;

  if (!nombre || !telefono) {
    return res.status(400).json({ ok: false, error: 'nombre y telefono son obligatorios' });
  }

  const leads = leerLeads();
  const existente = leads.find((l) => l.Telefono === telefono);

  if (existente) {
    return res.json({ ok: true, nuevo: false, lead: existente });
  }

  const fecha = new Date().toISOString();
  const linea = `Nombre: ${nombre} | Telefono: ${telefono} | Direccion: ${direccion || 'N/D'} | Fecha: ${fecha}\n`;
  fs.appendFileSync(LEADS_FILE, linea);

  return res.json({
    ok: true,
    nuevo: true,
    lead: { Nombre: nombre, Telefono: telefono, Direccion: direccion || 'N/D', Fecha: fecha }
  });
});

// Listar leads registrados (para revisar/depurar)
app.get('/leads', (req, res) => {
  res.json({ ok: true, leads: leerLeads() });
});

// --- Servicio de Servicios (catalogo del doctor) ---

const SERVICIOS = [
  { id: 1, nombre: 'Consulta general', precio: 20, duracion_min: 30 },
  { id: 2, nombre: 'Control de presion', precio: 10, duracion_min: 15 },
  { id: 3, nombre: 'Inyeccion / aplicacion de medicamento', precio: 8, duracion_min: 15 },
  { id: 4, nombre: 'Curacion de heridas', precio: 15, duracion_min: 20 },
  { id: 5, nombre: 'Certificado medico', precio: 12, duracion_min: 15 },
  { id: 6, nombre: 'Toma de signos vitales', precio: 5, duracion_min: 10 }
];

app.get('/servicios', (req, res) => {
  const { texto } = req.query;

  if (!texto) {
    return res.json({ ok: true, servicios: SERVICIOS });
  }

  const filtro = texto.toLowerCase();
  const resultado = SERVICIOS.filter((s) => s.nombre.toLowerCase().includes(filtro));
  res.json({ ok: true, servicios: resultado });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, mensaje: 'Backend Agenda IA corriendo' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend Agenda IA escuchando en http://localhost:${PORT}`);
});
