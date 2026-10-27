# Agenda IA — MVP de reservas por WhatsApp

Agenda IA es una plataforma SaaS multiempresa y multiprofesional para atender clientes por WhatsApp con IA, informar servicios, consultar disponibilidad real y gestionar citas sin mezclar los datos de cada profesional.

Actualmente se prueba con Postman. El flujo está preparado para sustituir esa entrada por WhatsApp Cloud API sin cambiar el núcleo de reservas.

```text
Postman / WhatsApp Cloud API
        |
        v
      n8n
        |
        +--> resolver contexto por canal
        +--> IA con memoria por canal y cliente
        +--> servicios, clientes, disponibilidad y reservas
        |
        v
Backend Express + PostgreSQL + Prisma
```

## Estado del MVP

- Arquitectura multi-tenant: organizaciones, profesionales y canales independientes.
- Contexto resuelto por identificador de canal.
- Servicios, clientes, horarios y disponibilidad aislados por organización y profesional.
- Reservas temporales con vencimiento configurable, por defecto 15 minutos.
- Protección transaccional y de PostgreSQL contra citas superpuestas.
- Expiración coherente de `RESERVA_TEMPORAL`, `PENDIENTE_PAGO` y su solicitud de pago asociada.
- Solicitudes de pago idempotentes: simulador local, enlaces únicos de PayPhone cuando está configurado y transferencias/efectivo con validación manual.
- Webhook PayPhone que confirma el pago y la cita tras verificar comercio, referencia, monto e idempotencia.
- Sincronización opcional de una cita confirmada con Google Calendar del profesional.

WhatsApp Cloud API, recordatorios y la interfaz visual del panel administrativo siguen siendo las próximas capas del producto.

## Estructura

```text
backend/
  prisma/                         Esquema, seeds y migraciones PostgreSQL.
  src/controllers/                Entrada HTTP de cada caso de uso.
  src/services/                   Reglas de negocio y transacciones.
  src/repositories/               Acceso a datos con Prisma.
  src/dto/ y src/eb/              Validación de entrada y respuestas HTTP.
  src/routes/                     Rutas versionables y aliases compatibles.
  src/shared/reservas.js          Estados y vencimiento centralizados.
  src/jobs/expirar-reservas.js    Limpieza periódica de reservas vencidas.
n8n/workflow-agenda-ia.json       Plantilla versionada del workflow.
postman/                          Colección para pruebas HTTP.
```

## Requisitos

- Node.js 18 o superior.
- Docker Desktop.
- PostgreSQL del `backend/docker-compose.yml`.
- n8n del directorio `n8n/`.
- Credencial OpenAI configurada en n8n.

## Inicio local

En una terminal de PowerShell:

```powershell
cd C:\Users\USUARIO\Proyectos\Chat-WhatsApp\appAgendaIA\backend
docker compose up -d
npm install
npx prisma migrate deploy
npm run dev
```

En otra terminal:

```powershell
cd C:\Users\USUARIO\Proyectos\Chat-WhatsApp\appAgendaIA\n8n
docker compose up -d
```

Verifica el backend en `http://localhost:3000/health` y abre n8n en `http://localhost:5678`.

## Variables de entorno

Usa [backend/.env.example](backend/.env.example) como referencia:

```env
DATABASE_URL="postgresql://USUARIO:PASSWORD@localhost:5433/agendaia?schema=public"
PORT=3000
NODE_ENV=development
MINUTOS_RESERVA=15
HORAS_PAGO_MANUAL=24
HORAS_VALIDACION_PAGO_MANUAL=72
PAGO_SIMULADOR_SECRETO=cambia-este-secreto-local
PAYPHONE_TOKEN=
PAYPHONE_STORE_ID=
PAYPHONE_LINKS_URL=https://pay.payphonetodoesposible.com/api/Links
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/integraciones/google/callback
CIFRADO_SECRET=usa-un-secreto-unico-en-produccion
```

`MINUTOS_RESERVA` debe ser un entero entre 1 y 60. El simulador de pagos se desactiva automáticamente cuando `NODE_ENV=production`.

## Workflow de n8n

El archivo [n8n/workflow-agenda-ia.json](n8n/workflow-agenda-ia.json) corresponde al workflow exportado desde la instancia local. Incluye:

- `Webhook Postman`.
- `resolver_contexto`.
- `AI Agent` con OpenAI.
- Memoria con clave `canal_id:usuario_id`.
- Herramientas `consultar_servicios`, `registrar_cliente`, `ver_disponibilidad`, `crear_reserva`, `solicitar_pago`, `reportar_pago_manual` y `consultar_estado_reserva`.

Para restaurarlo en otra instancia, importa el JSON, asigna tu credencial de OpenAI al nodo correspondiente y publica el workflow. Las credenciales se exportan como referencias, nunca con su secreto. Después de editar el flujo en n8n, usa **More actions → Download** para sustituir esta plantilla por una nueva exportación antes de versionarla.

`resolver_contexto` devuelve la respuesta estándar del backend en `data`. Por eso toda expresión de n8n que lea el canal, el profesional, la organización o el catálogo debe partir de `$('resolver_contexto').first().json.data`. El mensaje de sistema del agente se configura en modo **Expression** para insertar el catálogo real del canal antes de llamar al modelo.

Cuando una reserva temporal requiere anticipo, el backend crea la solicitud de pago dentro de la transacción y, después de confirmar la reserva, genera el enlace PayPhone fuera de la transacción. Así no mantiene bloqueado el horario esperando una red externa. El agente solo comparte un enlace cuando la respuesta contiene `pago.proveedor = PAYPHONE` y `pago.urlPago` HTTPS no vacío.

El simulador sigue siendo exclusivamente de desarrollo. Para transferencias o efectivo, el chat puede registrar el reporte, pero el profesional debe validarlo desde el panel antes de que la cita pase a `CONFIRMADA`.

`POST /clientes` es la ruta actual para registrar clientes. `POST /leads` continúa disponible como alias de compatibilidad con integraciones anteriores.

## Flujo de reserva y pago simulado

1. El agente registra o recupera al cliente.
2. Consulta disponibilidad y crea la reserva. Si el servicio exige anticipo, el backend crea en la misma transacción una única solicitud de cobro y deja la cita en `PENDIENTE_PAGO`.
3. `POST /pagos/solicitar` conserva un uso idempotente: recupera la solicitud vigente o la crea si una integración anterior dejó una reserva sin pago.
4. El webhook simulado confirma el pago de forma idempotente.
5. Si el pago coincide y la reserva sigue vigente, la cita pasa a `CONFIRMADA`.
6. Si la reserva vence, su solicitud pasa a `EXPIRADO`.
7. Si el pago llega tarde, se registra como confirmado, pero no reabre ni duplica una cita expirada.

El backend decide las transiciones. n8n y el cliente no pueden marcar una cita como confirmada directamente.

### Crear una solicitud de pago

```http
POST http://localhost:3000/pagos/solicitar
Content-Type: application/json

{
  "canal_id": "wa-ana-demo",
  "cita_id": 4
}
```

La respuesta contiene `referenciaCobro`, `montoEsperado`, `moneda` y `fechaExpiracion`. Reintentar la misma petición mientras el pago está pendiente devuelve la misma solicitud.

### Consultar el estado de una reserva y pago

El agente dispone de la herramienta interna `consultar_estado_reserva`. Para verificarla directamente durante desarrollo:

```http
GET http://localhost:3000/pagos/estado?canal_id=wa-ana-demo&cita_id=4
```

La consulta está aislada por el canal y aplica la expiración pendiente antes de responder para evitar informar un estado obsoleto.

### Simular el webhook aprobado

```http
POST http://localhost:3000/webhooks/pagos/simulador
Content-Type: application/json
x-pago-simulador-secreto: agendaia-simulador-local

{
  "evento_id": "sim-ana-0001",
  "referencia_cobro": "REFERENCIA_DEVUELTA_POR_SOLICITAR",
  "monto": 30
}
```

Usa un `evento_id` nuevo por cada evento de la pasarela. Repetir exactamente el mismo evento no duplica el pago ni la cita.

Para probar un monto incorrecto, envía un valor diferente a `montoEsperado`. El pago quedará `EN_CONCILIACION` y la cita no será confirmada.

## Comprobación en Prisma Studio

```powershell
cd C:\Users\USUARIO\Proyectos\Chat-WhatsApp\appAgendaIA\backend
npx prisma studio
```

Revisa estas tablas después de las pruebas:

- `citas`: estado y `fecha_expiracion_reserva`.
- `pagos`: referencia única, monto esperado y estado.
- `transacciones_bancarias`: cada `evento_id` recibido por el simulador.
- `conciliaciones_pago`: asociación entre el pago y el evento.

## PayPhone, transferencias y calendario

### PayPhone

1. Solicita a PayPhone el token Bearer y el `storeId` de producción o pruebas.
2. Configura `PAYPHONE_TOKEN` y `PAYPHONE_STORE_ID` en `backend/.env` y reinicia el backend. Mientras ambas variables estén vacías, el flujo conserva el simulador local.
3. Configura en PayPhone una URL pública HTTPS para la notificación externa: `https://TU-DOMINIO/webhooks/pagos/payphone/NotificacionPago`. Para probar en local, expón el backend con un túnel HTTPS temporal.
4. El chat creará una reserva, generará un enlace único y solo compartirá `urlPago` si PayPhone respondió correctamente. La notificación aprobada valida comercio, identificador único, monto e idempotencia antes de confirmar la cita.

### Transferencia o efectivo

El administrador configura sus cuentas en `/cobros/medios/guardar`, o cada profesional las suyas en `/cobros/mios/guardar`. Cuando el cliente elige transferencia, el chat muestra únicamente las cuentas activas devueltas por el backend y concede `HORAS_PAGO_MANUAL` (24 por defecto) para pagar. Cuando informa que pagó, el pago queda `COMPROBANTE_RECIBIDO` y la reserva conserva el horario durante `HORAS_VALIDACION_PAGO_MANUAL` (72 por defecto), para que el profesional revise su banco o efectivo. Solo el profesional confirma desde el panel con `POST /pagos/manual/confirmar`; entonces se registra la conciliación y la cita pasa a `CONFIRMADA`.

### Google Calendar

Configura un cliente OAuth de Google Calendar con el callback `GOOGLE_CALENDAR_REDIRECT_URI`. El profesional autenticado obtiene su URL de autorización con `POST /integraciones/google/autorizar`, completa la autorización y las citas que se confirmen después se crean o actualizan en su calendario. Si Google no está configurado o falla, el pago y la cita continúan siendo válidos: queda un registro de error para reintentar la sincronización.

Antes de producción también se requiere autenticación entre n8n y el backend, validación de la firma de WhatsApp Cloud API y autorización para cualquier panel administrativo.

Antes de producción también se requiere autenticación entre n8n y el backend, validación de la firma de WhatsApp Cloud API y autorización para cualquier panel administrativo.
