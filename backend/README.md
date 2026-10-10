# Backend Agenda IA — Arquitectura

API en Node.js + Express + Prisma + PostgreSQL que usa n8n (el agente de IA) para consultar servicios, ver disponibilidad, registrar pacientes, reservar citas y solicitar pagos.

El código está organizado **por capas**: cada carpeta tiene una sola responsabilidad y cada capa solo habla con la siguiente. Este documento explica por dónde entra una petición, adónde va, y qué hace cada carpeta.

---

## 1. Cómo viaja una petición

```
Cliente (n8n / Postman)
        │  HTTP
        ▼
server.js ──► app.js            arranca el servidor; aplica cors y lectura de JSON
        │
        ▼
routes/*.routes.js              asocia la URL con un controller (usa las rutas de routes/paths)
        │   (middlewares propios de la ruta, ej. verificarSecretoSimulador)
        ▼
controllers/*Controller.js      1) valida la entrada con dto/request
        │                       2) llama al service
        │                       3) responde con ok() usando un eb
        ▼
services/*Service.js            reglas de negocio y transacciones
        │
        ▼
repositories/*Repository.js     consultas a la base (Prisma)
        │
        ▼
PostgreSQL
```

La respuesta hace el camino inverso: el service devuelve datos, el controller los convierte con un **EB** (la forma exacta que ve el cliente) y los envía con `ok()`.

Si algo falla en cualquier punto, se lanza un `AppError` (con su código HTTP). El `asyncHandler` lo recoge y lo manda al `errorHandler`, que responde siempre con el mismo formato.

### Ejemplo real: `POST /citas/reservar`

| Paso | Archivo | Qué hace |
|---|---|---|
| 1 | `routes/citas.routes.js` | La URL `/citas/reservar` llega al controller (la ruta sale de `paths/CitasPaths.js`) |
| 2 | `controllers/CitasController.js` | Llama a `ReservaRequest` y luego a `CitasService` |
| 3 | `dto/request/ReservaRequest.js` | Valida `canal_id`, `cliente_id`, `servicio_id` y que `fecha_inicio` tenga zona horaria |
| 4 | `services/CitasService.js` | Orquesta todo dentro de una transacción (ver abajo) |
| 5 | `services/CanalesService.js` | Verifica que el canal, su organización y su profesional estén activos |
| 6 | `repositories/BloqueosRepository.js` | Toma el bloqueo del profesional: una sola reserva a la vez |
| 7 | `services/DisponibilidadService.js` + `DisponibilidadCalculador.js` | Confirma que el horario siga libre |
| 8 | `repositories/CitasRepository.js` | Crea la reserva temporal (vence a los 15 min) |
| 9 | `eb/ReservaEB.js` | Da forma a la respuesta |
| 10 | `utils/respuesta.js` | `ok()` devuelve `{ estado: 1, mensaje, data }` con HTTP 201 |

---

## 2. Formato único de respuesta

Todas las respuestas (éxito o error) tienen la misma forma, para que n8n solo mire `estado`:

```json
{ "estado": 1,  "mensaje": "Servicios obtenidos correctamente", "data": [ ... ] }
{ "estado": -1, "mensaje": "Profesional no encontrado",         "data": [] }
```

- `estado`: `1` éxito, `-1` fallo.
- `mensaje`: texto para el usuario (sale de `config/mensajes.js`).
- `data`: el resultado (un arreglo vacío en los errores).
- Además se usa el código HTTP correcto: 200, 201, 400, 401, 403, 404, 409, 503 o 500.

| HTTP | Cuándo |
|---|---|
| 400 | Datos de entrada inválidos |
| 401 | Secreto del webhook incorrecto |
| 403 | Canal, organización o profesional inactivos |
| 404 | No existe lo que se busca |
| 409 | Conflicto: horario ocupado, cita ya confirmada, reserva expirada |
| 503 | Simulador de pagos sin configurar |
| 500 | Error interno no controlado |

---

## 3. Qué hace cada carpeta

Todo vive en `backend/src/`.

| Carpeta / archivo | Responsabilidad | Reglas |
|---|---|---|
| `server.js` | Punto de entrada. Conecta Prisma, levanta Express, inicia el job de expiración y cierra con orden | Es lo que ejecuta `npm start` |
| `app.js` | Arma la aplicación: cors, JSON, rutas y el manejador de errores | El `errorHandler` va siempre al final |
| `routes/` | Un router de Express por módulo: une la URL con el controller | Sin lógica |
| `routes/paths/` | Constantes de las URLs de cada módulo (`BASE`, rutas internas) | Solo constantes. Aquí se mantiene `/leads` porque n8n lo llama |
| `controllers/` | Reciben la petición, validan, llaman al service y responden | Sin Prisma y sin reglas de negocio |
| `dto/request/` | Validan y normalizan lo que entra (ids, textos, fechas) | Lanzan `AppError` 400 |
| `eb/` | Clases que dan forma a lo que sale. Mantienen los nombres de campo que lee n8n | Un EB por concepto |
| `services/` | Reglas de negocio, transacciones y orquestación | Sin `req`/`res`. Usan repositorios y otros services |
| `repositories/` | Las consultas a la base de datos, una carpeta de funciones por tabla | Solo Prisma. Reciben `db` (Prisma normal o una transacción) |
| `middlewares/` | Funciones que corren antes o después del controller | `asyncHandler`, `errorHandler`, `verificarSecretoSimulador` |
| `errors/` | `AppError`: error con su código HTTP | Se lanza desde cualquier capa |
| `config/` | `constantes.js` (valores, estados, tiempos) y `mensajes.js` (textos) | Nada de valores sueltos en el código |
| `utils/` | Funciones puras de apoyo: `respuesta`, `validaciones`, `texto`, `horarios`, `montos` | Sin acceso a la base |
| `jobs/` | Tareas periódicas: `expirar-reservas.js` corre cada 60 s | Heredado, ver sección 7 |
| `shared/` | `prisma.js` (cliente único) y `reservas.js` (vencimiento y expiración de reservas) | Heredado, ver sección 7 |
| `../prisma/` | `schema.prisma`, migraciones y seeds | El esquema es la fuente de verdad de la base |

### Quién puede importar a quién

```
routes ─► controllers ─► services ─► repositories ─► shared/prisma
              │              │
              ├─► dto        ├─► otros services (CanalesService, DisponibilidadService)
              └─► eb         └─► utils, config, errors
```

- Un controller **nunca** usa Prisma ni un repositorio directamente.
- Un service **nunca** usa `req`, `res` ni conoce HTTP.
- Un repository **solo** hace consultas.
- Ninguna capa importa "hacia arriba" (un repository no importa un service).

---

## 4. Endpoints

| Método | URL | Parámetros | Para qué |
|---|---|---|---|
| GET | `/leads` | `organizacionId` | Lista los pacientes de una organización |
| POST | `/leads` | `organizacionId`, `nombre`, `telefono`, `direccion?` | Registra un paciente (si el teléfono ya existe, devuelve el existente) |
| GET | `/servicios` | `profesionalId`, `texto?` | Servicios de un profesional (filtra por nombre o descripción) |
| GET | `/servicios/:id` | `profesionalId` | Un servicio de un profesional |
| GET | `/contexto/canal/:identificador` | — | Resuelve de quién es un canal (organización y profesional) |
| GET | `/disponibilidad` | `profesionalId`, `servicioId`, `desde?`, `dias?` | Horarios libres (por defecto 7 días, máximo 30) |
| POST | `/citas/reservar` | `canal_id`, `cliente_id`, `servicio_id`, `fecha_inicio` | Reserva temporal de un horario |
| POST | `/pagos/solicitar` | `canal_id`, `cita_id` | Crea la solicitud de cobro de una reserva |
| POST | `/webhooks/pagos/simulador` | `evento_id`, `referencia_cobro`, `monto` + header `x-pago-simulador-secreto` | Simula el aviso de la pasarela y confirma la cita |
| GET | `/health` | — | Comprobar que el backend está vivo |

Los nombres de los parámetros (por ejemplo `canal_id` con guion bajo) **no se cambian**: n8n depende de ellos.

### Configuración de módulos (solo super admin)

Todas requieren `Authorization: Bearer <token>` de un usuario `SUPER_ADMIN`; a cualquier otro se le responde 403.
Un **botón** es una acción del catálogo (`acciones`: Ver, Crear, Editar, Eliminar...) asignada a una pantalla.
Al asignarla se crea su permiso `<recurso>.<accion>` (ej. `/historia-clinica` + `VER` → `historia_clinica.ver`):
los roles y `exigirPermiso` siguen trabajando con permisos. El menú envía `Acciones` (códigos de permiso)
y `Botones` (acción, nombre, ícono y si requiere selección) de cada pantalla.

| Método | URL | Body | Para qué |
|---|---|---|---|
| POST | `/configuracion-modulos/consultar` | — | Árbol módulos → pantallas → botones (incluye inactivos) y el catálogo de acciones |
| POST | `/configuracion-modulos/modulos/guardar` | `moduloId?`, `codigo` (solo al crear, `MAYUSCULAS_CON_GUION_BAJO`), `nombre`, `descripcion?`, `icono?` (lucide, ej. `bar-chart`), `orden?`, `esBase?` | Crea o edita un módulo |
| POST | `/configuracion-modulos/modulos/estado` | `moduloId`, `activo` | Activa o desactiva un módulo |
| POST | `/configuracion-modulos/pantallas/guardar` | `pantallaId?`, `moduloId`, `codigo` (solo al crear), `nombre`, `ruta` (un solo segmento, ej. `/historia-clinica`), `icono?`, `orden?`, `soloPlataforma?` | Crea o edita una pantalla de un módulo |
| POST | `/configuracion-modulos/pantallas/estado` | `pantallaId`, `activo` | Activa o desactiva una pantalla |
| POST | `/configuracion-modulos/pantallas/acciones` | `pantallaId`, `accionIds` | Agrega acciones del catálogo a la pantalla (las que ya tiene se ignoran) |
| POST | `/configuracion-modulos/botones/eliminar` | `botonId` | Elimina un botón que no use ningún rol ni el código del backend |

Reglas:
- Los códigos no se editan después de crearse: los referencian roles, seeds y `config/permisos.js`.
- La ruta de una pantalla es única y de un solo segmento, porque el front abre el feature con ese nombre.
- `soloPlataforma = true` oculta la pantalla y sus botones a todos menos al super admin, aunque el módulo sea base.
- La pantalla que contiene `modulos.gestionar` (Configuración de módulos) y su módulo no se pueden desactivar.
- El administrador de empresa recibe todos los permisos de los módulos de su empresa, incluidos los botones nuevos; el personal, los de su rol.

### Planes y suscripciones

**Módulos de una empresa** = módulos base + módulos de su plan vigente + módulos comprados sueltos (`organizaciones_modulos`).
Una empresa recién registrada no tiene plan: solo ve los módulos base hasta elegir uno.

| Método | URL | Quién | Body | Para qué |
|---|---|---|---|---|
| POST | `/planes/consultar` | Super admin | — | Planes con sus módulos y módulos vendibles con su precio suelto |
| POST | `/planes/guardar` | Super admin | `planId?`, `codigo` (solo al crear), `nombre`, `descripcion?`, `precio`, `moneda?`, `periodicidad?` (`MENSUAL`/`ANUAL`), `orden?`, `moduloIds` | Crea o edita un plan; `moduloIds` reemplaza su lista de módulos |
| POST | `/planes/estado` | Super admin | `planId`, `activo` | Un plan inactivo ya no se ofrece; las empresas suscritas lo conservan |
| POST | `/planes/modulos/precio` | Super admin | `moduloId`, `precio?` (vacío = no se vende suelto), `moneda?`, `periodicidad?` | Precio de venta del módulo suelto |
| POST | `/suscripcion/consultar` | Admin de empresa | — | Plan vigente, planes disponibles, módulos sueltos contratados y disponibles, historial |
| POST | `/suscripcion/cambiar-plan` | Admin de empresa | `planId` | Contrata o cambia el plan; el anterior queda `FINALIZADA` en el historial |
| POST | `/suscripcion/modulos/comprar` | Admin de empresa | `moduloId` | Compra un módulo suelto que no esté en su plan |
| POST | `/suscripcion/modulos/cancelar` | Admin de empresa | `moduloId` | Cancela un módulo suelto (queda la fecha de fin) |

Cada suscripción y cada módulo suelto guarda el precio, la moneda y la periodicidad del momento de la compra.

**Pasarela de pago:** hoy no hay; `services/CobroSuscripcionesService.js` deja lo contratado `VIGENTE` al instante.
Para conectarla, ese servicio debe crear la orden de cobro y devolver `PENDIENTE_PAGO` con su referencia,
y un webhook nuevo pasa la suscripción a `VIGENTE` al confirmar el pago.

---

## 5. Reglas de negocio importantes

- **Contexto por canal.** Quien escribe nunca elige al profesional: lo determina el canal por el que llegó el mensaje (`CanalesService`).
- **Reserva temporal.** Dura 15 minutos (`MINUTOS_RESERVA`). Pasado ese tiempo, el job la marca `EXPIRADA` y el horario vuelve a quedar libre.
- **Sin dobles reservas.** Se protege en tres niveles: un bloqueo de transacción por profesional (`BloqueosRepository`), una verificación de disponibilidad dentro de la misma transacción y una restricción `EXCLUDE` en PostgreSQL.
- **Idempotencia.** Repetir la misma reserva devuelve la ya existente. Repetir el mismo evento de pago no duplica nada.
- **Pagos.** El backend es el único que decide las transiciones de estado. `n8n` y el cliente no pueden marcar una cita como confirmada.
  - Solicitud: reserva `RESERVA_TEMPORAL` → `PENDIENTE_PAGO`.
  - Evento con el monto correcto: pago `CONFIRMADO` y cita `CONFIRMADA`.
  - Monto distinto: pago `EN_CONCILIACION` y la cita no se confirma.
  - Pago tardío (la reserva ya expiró): se registra, pero no reabre la cita.
- **Disponibilidad.** El cálculo de horarios (`DisponibilidadCalculador`) es una función pura: recibe horarios, excepciones y citas y devuelve los días con huecos libres. No usa la base de datos, por lo que se puede probar con datos inventados.

---

## 6. Cómo levantarlo

Requisitos: Node.js 20 o superior, Docker Desktop.

```powershell
cd backend
docker compose up -d          # PostgreSQL en el puerto 5433
npm install
npx prisma generate
npx prisma migrate deploy     # crea las tablas
node prisma/seed.js           # datos de prueba (Carlos)
node prisma/seed-multitenant.js   # segundo profesional (Ana)
npm run dev                   # http://localhost:3000
```

Variables de entorno (`backend/.env`, no se sube a git):

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL (`postgresql://agendaia:...@localhost:5433/agendaia?schema=public`) |
| `PORT` | Puerto del servidor (por defecto 3000) |
| `NODE_ENV` | `development` o `production`. En `production` el simulador de pagos no existe |
| `MINUTOS_RESERVA` | Duración de la reserva temporal, entre 1 y 60 (por defecto 15) |
| `PAGO_SIMULADOR_SECRETO` | Clave que debe enviar el webhook del simulador en el header `x-pago-simulador-secreto` |

`node --watch` no recarga al cambiar el `.env`: reinicia el servidor a mano.

---

## 7. Cómo agregar un módulo o endpoint nuevo

Sigue siempre el mismo orden, de afuera hacia adentro:

1. `routes/paths/XxxPaths.js`: las URLs.
2. `repositories/XxxRepository.js`: las consultas a Prisma (con el parámetro `db = prisma`).
3. `dto/request/XxxRequest.js`: validación de la entrada.
4. `eb/XxxEB.js`: la forma de la respuesta.
5. `services/XxxService.js`: la regla de negocio.
6. `controllers/XxxController.js`: valida, llama al service y responde con `ok()`.
7. `routes/xxx.routes.js`: une la URL con el controller (envuelto en `asyncHandler`).
8. `app.js`: `app.use(XxxPaths.BASE, xxxRoutes)`, antes del `errorHandler`.

Los textos nuevos van a `config/mensajes.js` y los valores fijos a `config/constantes.js`, nunca escritos dentro del código.

---

## 8. Pendientes

- **`shared/` y `jobs/`** vienen del diseño original y siguen como estaban. `shared/prisma.js` podría pasar a `config/` y `shared/reservas.js` a un service.
- **`/health`** todavía responde con el formato antiguo (`{ ok, mensaje }`).
- **Seguridad:** limitador de peticiones, autenticación entre n8n y el backend (hoy `canal_id` llega en el cuerpo y no se verifica), y cifrado opcional de respuestas.
- **n8n:** las expresiones de `resolver_contexto` usan `json.data...`. Para `POST /pagos/solicitar`, el backend expone tanto el formato estándar (`estado`, `data`) como los campos directos `ok`, `pago.id` y `pago.referenciaCobro`; el agente debe validar esos datos antes de informar que inició un cobro.
- **Logs** en los services.
- **Pasarela real** de pagos (PayPhone) en lugar del simulador.
