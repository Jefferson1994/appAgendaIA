# WhatsApp Cloud API: desarrollo local

El backend recibe Meta en un listener independiente, puerto 3002. Ese puerto solo expone
GET/POST /webhooks/whatsapp. El puerto 3000 y las herramientas de n8n permanecen internos.

Flujo: Meta -> receptor firmado -> PostgreSQL (meta_mensajes) -> n8n/chat-agenda -> Cloud API -> WhatsApp.
El webhook confirma HTTP 200 después de persistir el evento, antes de esperar la respuesta de la IA.
El ID wamid es clave única: una reentrega no vuelve a invocar al agente. Las conversaciones de un
mismo número de destino/remitente se procesan en orden; otra conversación puede procesarse por otro worker.

## 1. Preparar backend

Desde backend:

    npm install
    npx prisma migrate deploy
    npx prisma generate

Completar .env (usar el token nuevo si el anterior apareció en una captura):

    META_WHATSAPP_ENABLED=true
    META_WHATSAPP_ACCESS_TOKEN=<token de Meta>
    META_WHATSAPP_APP_SECRET=<App settings / Basic / App secret>
    META_WHATSAPP_VERIFY_TOKEN=<cadena aleatoria de al menos 32 caracteres>
    META_WHATSAPP_CHANNEL_MAP='{"1398257703369335":"wa-fredy-demo"}'
    META_WHATSAPP_API_VERSION=v25.0
    META_WHATSAPP_WEBHOOK_HOST=127.0.0.1
    META_WHATSAPP_WEBHOOK_PORT=3002
    META_WHATSAPP_N8N_URL=http://127.0.0.1:5678/webhook/chat-agenda

Los IDs mostrados aquí son del número de prueba usado durante la integración. Reemplazarlos si Meta
asigna otros. El valor de CHANNEL_MAP es phone_number_id (no el teléfono visible ni WABA ID).
El canal debe existir y estar activo; determina organización y profesional. No se toma del mensaje.
No incluir secretos reales en git ni en screenshots. El access token temporal vence: reemplazarlo
cuando Meta deje de autorizar. El App secret es diferente del access token.

Arrancar n8n y backend (una sola instancia de npm run dev). Al habilitar Meta, aparece:

    Meta: receptor disponible en http://127.0.0.1:3002/webhooks/whatsapp

Para comprobar qué falta, sin revelar secretos ni enviar mensajes: npm run meta:check.
Después de cambiar .env, reiniciar el backend para cargar los valores nuevos.

## 2. URL pública para Meta

Usar un túnel HTTPS al puerto 3002, por ejemplo, con ngrok instalado/configurado:

    ngrok http 3002

No tunelizar 3000 ni 5678: esos puertos contienen API internas. En Meta configurar:

    Callback URL: https://<dominio-del-tunel>/webhooks/whatsapp
    Verify token: mismo META_WHATSAPP_VERIFY_TOKEN del .env

Suscribir el campo messages y la app a la WABA de prueba. El handshake GET debe devolver el hub.challenge.
La firma X-Hub-Signature-256 se valida sobre los bytes originales con el App secret.
Si cambia el dominio del túnel, cambiar también Callback URL en Meta.

En el iPhone, responder al número de prueba de Meta desde un destinatario verificado. Esto debe
recorrer el flujo real de n8n y entregar la respuesta por WhatsApp. No se requiere pasar a producción.

## 3. Qué admite

- Texto y respuestas de botones/listas se envían al agente existente.
- usuario_id es estable por remitente (meta:<wa_id>); memoria n8n usa canal + usuario_id.
- telefono_whatsapp contiene el número real del remitente, solo tras validar la firma de Meta.
- Eventos de entrega/lectura se reconocen con 200 sin llamar a la IA ni generar bucles.
- Un mensaje con imagen JPG/PNG o documento PDF se descarga de Meta y se guarda como comprobante
  solo si hay exactamente una transferencia pendiente/vigente del remitente con ese profesional.
  Se guarda en documentos/SeaweedFS y se enlaza en comprobantes_pago. El archivo se sirve por
  /documentos/:id/archivo con la autenticación y permisos existentes; no se publica el filer.
- Recibir el comprobante reporta COMPROBANTE_RECIBIDO; jamás confirma dinero ni cita por sí solo.
- Archivos sin reserva inequívoca y otros tipos de mensajes reciben una explicación y no se adjudican
  a otro cliente. El frontend puede usar la relación documentoId existente para abrir el comprobante;
  este cambio no crea una pantalla nueva en FromAgendaIA.

Al elegir efectivo se confirma la cita y el pago queda pendiente para el día de la atención. El QR de
cobro no se envía automáticamente como imagen con este adaptador; el chat puede dar los datos de cuenta.

## 4. Operación y errores

Consultar en DBeaver:

    SELECT id, canal_id, remitente, tipo, estado, ultimo_error, fecha_creacion
    FROM meta_mensajes ORDER BY fecha_creacion DESC LIMIT 30;

Estados normales: PENDIENTE -> PROCESANDO -> RESPUESTA_LISTA -> ENVIANDO -> ENVIADO.
Se guarda la respuesta antes de enviarla, para no volver a ejecutar la IA cuando la respuesta ya existe.
Si el proceso muere en una llamada externa, el lease vence y se registra ERROR. Se evita reintentar
automáticamente una operación cuyo resultado sea ambiguo (podría haber creado una cita o enviado un mensaje).
Un error del agente produce una respuesta de cortesía y conserva ultimo_error. Revisar el estado de la cita
antes de repetir una reserva. Un token vencido produce ERROR en el envío; renovar la credencial y revisar
las filas antes de reintentar. No habilitar reintentos ciegos en SQL.

Para pruebas locales del código, sin enviar mensajes reales:

    node --test tests/meta-whatsapp.test.js tests/meta-comprobantes.test.js

Prueba de persistencia/cola, solo en la BD local sin tráfico Meta (crea y elimina sus propias filas):

    $env:META_TEST_DB='true'
    node --test tests/meta-cola.test.js

Producción necesita dominio HTTPS estable, token/credenciales administrados, canal y cuenta por negocio
según el modelo elegido, supervisión de errores/retención de datos y los requisitos aplicables de Meta.
