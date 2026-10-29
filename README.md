# Agenda IA — MVP de reservas por WhatsApp

Agenda IA es una plataforma SaaS multiempresa y multiprofesional para atender clientes por WhatsApp con IA, informar servicios, consultar disponibilidad real y gestionar citas sin mezclar los datos de cada profesional.

Se puede probar con Postman y con WhatsApp Cloud API. El adaptador Meta recibe mensajes firmados en un puerto dedicado, los persiste en PostgreSQL y llama al chat existente de n8n. Configuración y límites: [backend/META-WHATSAPP.md](backend/META-WHATSAPP.md).

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
- Solicitudes de pago idempotentes: simulador local, enlaces únicos de PayPhone cuando está configurado para el canal, transferencia con revisión manual y efectivo en la cita.
- Webhook PayPhone que confirma el pago y la cita tras verificar comercio, referencia, monto e idempotencia.
- Sincronización opcional de una cita confirmada con Google Calendar del profesional.

WhatsApp Cloud API dispone de receptor, cola, envío de texto y recepción de comprobantes. Debe habilitarse con las credenciales de Meta y un webhook HTTPS. La pantalla de revisión de comprobantes y los recordatorios requieren su integración en el panel.

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

Cuando una reserva temporal requiere anticipo, el backend crea una solicitud pendiente en la transacción. El chat consulta `GET /pagos/opciones` y presenta los métodos disponibles. Solo al elegir pasarela se intenta generar un enlace PayPhone fuera de la transacción. El agente comparte el enlace únicamente si el proveedor y la URL reales fueron devueltos.

El simulador sigue siendo exclusivamente de desarrollo y no genera enlaces reales. En efectivo, la cita se confirma y el pago queda pendiente hasta el cobro presencial. Una transferencia reportada requiere validación del profesional antes de confirmar la cita.

`POST /clientes` es la ruta actual para registrar clientes. `POST /leads` continúa disponible como alias de compatibilidad con integraciones anteriores.

## Crear una aplicación de Meta y probar WhatsApp en desarrollo

Esta guía permite que cada desarrollador configure su propia aplicación de prueba de Meta y la conecte a su instalación local de Agenda IA. Los nombres de los menús pueden variar si Meta cambia su interfaz. La aplicación de Meta se configura en el **navegador del computador**; WhatsApp en el teléfono se usa para enviar y recibir los mensajes de prueba.

### 1. Crear la aplicación y el portafolio

1. Entra en [Meta for Developers](https://developers.facebook.com/apps/) con tu cuenta de Meta y selecciona **Create app**.
2. En **App details**, escribe un nombre, por ejemplo `Agenda IA - Desarrollo`, y tu correo de contacto. Pulsa **Next**.
3. En **Use cases**, selecciona **Connect with customers through WhatsApp** y pulsa **Next**.
4. En **Business**, elige el portafolio empresarial que corresponda. Si no tienes uno, usa **Create a business portfolio**, completa el nombre y los datos de contacto y créalo. Si Meta ofrece **Verify later**, puedes posponer la verificación para comenzar las pruebas; esto no elimina requisitos posteriores de publicación.
5. Selecciona el portafolio creado, continúa por **Requirements**, revisa el resumen y pulsa **Create app**. Si Meta solicita contraseña o verificación de seguridad, complétala en Meta.

### 2. Obtener el número y enviar el primer mensaje

1. En el panel de la aplicación, abre **Use cases** y personaliza **Connect on WhatsApp**. Selecciona el portafolio y pulsa **Continue** si aparece esa opción.
2. En **Basic setup → Step 1. Try it out**, Meta proporciona un **test number**, su **Phone Number ID** y un **Messaging account ID** o identificador de la cuenta de WhatsApp Business (WABA). Guarda los identificadores: cada desarrollador usará los de su propia cuenta.
3. Pulsa **Generate token** y completa el diálogo de autorización de Meta. Este **access token** permite llamar a la API y es temporal; si vence, genera otro y actualízalo localmente.
4. En **Recipient**, añade o selecciona el número personal con WhatsApp. Sigue el proceso de verificación que indique Meta; usa el formato internacional, por ejemplo el prefijo `+593` para Ecuador. El número de prueba de Meta y el número personal son distintos.
5. Selecciona la plantilla ofrecida, por ejemplo **Order Confirmation**, y pulsa **Send message**. Recibirla en el teléfono comprueba el envío de Meta, pero todavía no demuestra que Agenda IA responda.
6. Obtén el **App secret** en **App settings → Basic → App secret → Show**; Meta puede solicitar tu contraseña. Es distinto del access token.

No pegues el token ni el App secret en el README, capturas, Git o conversaciones. Si se expusieron, revócalos o regénéralos en Meta y actualiza la configuración local.

### 3. Preparar Agenda IA y asociar el número con un profesional

1. Instala las dependencias y aplica las migraciones siguiendo **Inicio local**. Mantén PostgreSQL, SeaweedFS y n8n en ejecución. Importa y publica el [workflow de n8n](n8n/workflow-agenda-ia.json), con su credencial de OpenAI asignada.
2. Asegúrate de que exista un canal de atención activo asociado a la organización y al profesional de prueba. Usa el `canal_id` real de tu base de datos; los datos de demostración pueden variar entre instalaciones.
3. En `backend/.env`, añade o completa estos valores, cada uno en su propia línea. Sustituye los marcadores por tus datos, sin incluir los signos `<` y `>`:

```env
META_WHATSAPP_ENABLED=true
META_WHATSAPP_ACCESS_TOKEN=<TOKEN_DE_META>
META_WHATSAPP_APP_SECRET=<APP_SECRET_DE_META>
META_WHATSAPP_VERIFY_TOKEN=<CADENA_ALEATORIA_PROPIA>
META_WHATSAPP_CHANNEL_MAP={"<PHONE_NUMBER_ID>":"<CANAL_ID_ACTIVO>"}
META_WHATSAPP_API_VERSION=v25.0
META_WHATSAPP_WEBHOOK_HOST=127.0.0.1
META_WHATSAPP_WEBHOOK_PORT=3002
META_WHATSAPP_N8N_URL=http://127.0.0.1:5678/webhook/chat-agenda
```

`PHONE_NUMBER_ID` es el identificador numérico que muestra Meta para su número de prueba; no es el número telefónico visible ni el WABA ID. `CANAL_ID_ACTIVO` identifica el canal de Agenda IA, por ejemplo `wa-fredy-demo` solo si existe en tu base. El verify token lo eliges tú: genera una cadena aleatoria de al menos 32 caracteres con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` y guárdala localmente. Usa la versión de Graph API compatible indicada por Meta; el ejemplo corresponde a la configuración actual del proyecto.

4. Inicia el backend con `npm run dev` desde `backend`. Debe mostrar que el receptor de Meta está disponible en el puerto `3002`. No inicies una segunda instancia si ya hay una ejecutándose en el puerto `3000`.
5. En otra terminal, desde `backend`, ejecuta `npm run meta:check`. Este diagnóstico revisa la configuración y las conexiones sin mostrar los secretos ni enviar mensajes.

### 4. Configurar el webhook público de prueba

1. Instala y configura [ngrok](https://ngrok.com/download) si todavía no lo tienes. Con el backend activo, abre otra terminal y ejecuta:

```powershell
ngrok http 3002
```

2. Copia la dirección HTTPS que muestra ngrok y añade `/webhooks/whatsapp`. Por ejemplo: `https://TU-DOMINIO.ngrok-free.dev/webhooks/whatsapp`. Mantén abierta la terminal del túnel. Expón únicamente el puerto `3002`, no los puertos internos `3000` o `5678`.
3. En Meta, entra en **Basic setup → Step 2. Production setup → Configure Webhooks**. Aunque el menú se llame Production setup, aquí se configura el receptor usado en esta prueba.
4. En **Callback URL**, pega la URL HTTPS completa. En **Verify token**, escribe exactamente el mismo valor de `META_WHATSAPP_VERIFY_TOKEN` de tu archivo `.env`. Pulsa **Verify and save**.
5. En **Webhook fields**, comprueba que **messages** aparezca como **Subscribed**. Además, la aplicación debe estar suscrita a la WABA de prueba: la suscripción del campo y la de la cuenta son pasos distintos. Si no recibes eventos, consulta [Subscribe to a WABA en la colección oficial de Meta](https://www.postman.com/meta/whatsapp-business-platform/request/26gui66/subscribe-to-a-waba) y, usando tu propio token autorizado, envía en Postman un `POST` a `https://graph.facebook.com/<VERSION>/<WABA_ID>/subscribed_apps`, con autorización **Bearer Token** y sin incluir el token en la URL. Una respuesta `success: true` indica que se aceptó la suscripción.
6. Meta puede mostrar un aviso sobre limitaciones de aplicaciones no publicadas. Trabaja con el número y destinatarios de prueba y comprueba qué permite el panel de tu aplicación; esta guía no implica publicar ni pasar a producción.

El botón **Test / Send to server** envía un evento de ejemplo al webhook: no envía un mensaje real al teléfono ni prueba toda la conversación. El callback de ngrok puede cambiar al reiniciarlo; actualízalo en Meta y verifica de nuevo si cambia.

### 5. Probar la conversación completa

1. Confirma que Docker, PostgreSQL, SeaweedFS, n8n, backend y ngrok sigan activos y que `npm run meta:check` no indique errores.
2. En el teléfono cuyo número verificaste en Meta, abre el mensaje de prueba recibido y responde **Hola** al número de prueba. El mensaje debe llegar al backend, pasar por n8n y responder por WhatsApp con el contexto del profesional asociado al canal.
3. Pide un servicio, elige una fecha y un horario disponible y proporciona los datos solicitados. Comprueba las opciones de pago que estén habilitadas para ese profesional. El simulador no produce un enlace real de PayPhone.
4. Revisa la cita y el pago en la base de datos o en el panel. Efectivo confirma la cita y deja el pago pendiente; transferencia requiere comprobante y validación manual. El receptor admite imágenes JPG/PNG y PDF cuando existe una transferencia pendiente inequívoca; la pantalla de revisión de comprobantes todavía debe integrarse en el frontend.

Si no hay respuesta, revisa que el túnel y ambos servicios sigan activos, que el token no haya vencido, que `messages` y la aplicación estén suscritos y que el mapa apunte al canal correcto. Consulta la tabla `meta_mensajes` y la sección de diagnóstico de [backend/META-WHATSAPP.md](backend/META-WHATSAPP.md). Antes de repetir una reserva, verifica si ya se creó; un error de envío no significa que la operación anterior no haya ocurrido.

Esta configuración es para pruebas locales. La incorporación de profesionales reales requiere autorización y gestión segura de sus cuentas, una URL HTTPS estable y los requisitos de Meta aplicables; el mapa y token global actuales no constituyen aún un proceso completo de incorporación multiempresa. Referencia: [documentación oficial de WhatsApp Cloud API de Meta](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api).


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

El administrador configura las cuentas de la empresa o de cada profesional. Al elegir transferencia, el cliente recibe los datos activos y tiene como máximo 24 horas, sin superar el inicio de la cita. Un comprobante recibido pasa a revisión manual y extiende la reserva hasta `HORAS_VALIDACION_PAGO_MANUAL`, sin superar el inicio de la cita. Solo al confirmar manualmente el pago se confirma la cita. Al elegir efectivo, se confirma la cita y el pago total queda pendiente para cobrarlo presencialmente.

### Google Calendar

Configura un cliente OAuth de Google Calendar con el callback `GOOGLE_CALENDAR_REDIRECT_URI`. El profesional autenticado obtiene su URL de autorización con `POST /integraciones/google/autorizar`, completa la autorización y las citas que se confirmen después se crean o actualizan en su calendario. Si Google no está configurado o falla, el pago y la cita continúan siendo válidos: queda un registro de error para reintentar la sincronización.

Antes de producción también se requiere autenticación entre n8n y el backend, validación de la firma de WhatsApp Cloud API y autorización para cualquier panel administrativo.

Antes de producción también se requiere autenticación entre n8n y el backend, validación de la firma de WhatsApp Cloud API y autorización para cualquier panel administrativo.
