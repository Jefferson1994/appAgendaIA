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
- Solicitudes de pago en modo simulador, con referencias únicas y webhook idempotente para pruebas locales.

La pasarela real, WhatsApp Cloud API, Google Calendar, recordatorios y el panel administrativo todavía no están integrados.

## Estructura

```text
backend/
  prisma/                         Esquema, seeds y migraciones PostgreSQL.
  src/modules/
    contexto/                     Resuelve organización y profesional por canal.
    pacientes/                    Clientes de una organización.
    servicios/                    Catálogo por profesional.
    disponibilidad/               Horarios disponibles reales.
    citas/                        Reservas temporales.
    pagos/                        Solicitudes de cobro y webhook simulador.
  src/shared/reservas.js          Estados y vencimiento centralizados.
  src/jobs/expirar-reservas.js    Limpieza periódica de reservas vencidas.
n8n/workflow-agenda-ia.json       Exportación actual del workflow.
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
PAGO_SIMULADOR_SECRETO=cambia-este-secreto-local
```

`MINUTOS_RESERVA` debe ser un entero entre 1 y 60. El simulador de pagos se desactiva automáticamente cuando `NODE_ENV=production`.

## Workflow de n8n

El archivo [n8n/workflow-agenda-ia.json](n8n/workflow-agenda-ia.json) corresponde al workflow exportado desde la instancia local. Incluye:

- `Webhook Postman`.
- `resolver_contexto`.
- `AI Agent` con OpenAI.
- Memoria con clave `canal_id:usuario_id`.
- Herramientas `consultar_servicios`, `registrar_paciente`, `ver_disponibilidad` y `crear_reserva`.

Para restaurarlo en otra instancia, importa el JSON, asigna tu credencial de OpenAI al nodo correspondiente y publica el workflow. Las credenciales se exportan como referencias, nunca con su secreto.

La herramienta de pago no se conecta todavía al agente: el simulador es exclusivamente para validar el backend antes de tener una URL real de checkout de una pasarela.

## Flujo de reserva y pago simulado

1. El agente registra o recupera al cliente.
2. Consulta disponibilidad y crea una `RESERVA_TEMPORAL`.
3. `POST /pagos/solicitar` crea una única solicitud de cobro y cambia la cita a `PENDIENTE_PAGO`.
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

## Próximo paso: pasarela real

Cuando se elija el proveedor, se reemplazará el simulador por un adaptador específico que cree un checkout y valide la firma de sus webhooks. La verificación debe usar el evento firmado y el identificador externo del proveedor; un comprobante de transferencia enviado como imagen no confirma una cita.

Antes de producción también se requiere autenticación entre n8n y el backend, validación de la firma de WhatsApp Cloud API y autorización para cualquier panel administrativo.
