# Agenda IA por WhatsApp — MVP

Prototipo funcional del flujo: **canal de chat → n8n → IA con contexto → backend → datos**.

Hoy corre simulando el canal con Postman, pero está pensado para reemplazarlo por Telegram o WhatsApp sin tocar el resto del flujo.

```
Postman (simula WhatsApp/Telegram)
        |
        v
   n8n (Webhook)
        |
        v
   AI Agent (Gemini) + memoria de conversacion por usuario_id
        |
        +--> tool: registrar_lead     --> Backend Node --> data/leads.txt
        |
        +--> tool: consultar_servicios --> Backend Node --> catalogo de servicios
```

El documento completo del proyecto (alcance de 6 semanas, modelo de datos, fases) está en
**"Agenda IA por WhatsApp — Plan de implementación"**. Esto que ves aquí es el MVP de la
**Semana 1 / Día 1-3**: probar que el agente conversa, entiende contexto y llama al backend real.

## Estructura del repo

```
backend/    API en Node/Express. Guarda leads en un .txt y expone el catalogo de servicios.
n8n/        docker-compose.yml para levantar n8n local + el workflow ya armado (JSON para importar).
postman/    Coleccion de Postman con requests de prueba, en orden, para simular una conversacion.
```

## Requisitos

- Docker Desktop
- Node.js 18+ (usa `nvm use 20` si tienes varias versiones instaladas)
- Una API key gratis de Google Gemini: https://aistudio.google.com/apikey

## Cómo levantar todo

### 1. Backend

```bash
cd backend
npm install
npm start
```

Debe quedar corriendo en `http://localhost:3000`. Pruébalo con `http://localhost:3000/health`.

Endpoints:

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/leads` | Registra un paciente nuevo `{ nombre, telefono, direccion }`. Si el telefono ya existe, no lo duplica. |
| `GET` | `/leads` | Lista los leads guardados (para depurar). |
| `GET` | `/servicios?texto=` | Devuelve el catálogo de servicios del doctor (filtrable por texto). |

Los datos se guardan en `backend/data/leads.txt` — es un archivo de texto plano a propósito, para
que el MVP no dependiera de instalar una base de datos. **El siguiente paso real es reemplazar esto
por Postgres** (ver "Qué sigue" abajo).

### 2. n8n

```bash
cd n8n
docker compose up -d
```

Abre `http://localhost:5678`:

1. Crea tu cuenta local de n8n (owner) — es solo local, no se sube a ningún lado.
2. Ve a **Credentials → Add Credential → Google Gemini** y pega tu API key de Gemini.
3. En el workflow, importa `n8n/workflow-agenda-ia.json` (menú `⋯` → **Import from File**).
4. Abre el nodo **"Google Gemini Chat Model"** y selecciona la credencial que creaste.
5. Publica el workflow (botón **"Publish"** arriba a la derecha).
6. Copia la URL del nodo **"Webhook Postman"** (algo como `http://localhost:5678/webhook/chat-agenda`).

> **Nota sobre el modelo:** Google va renombrando/retirando modelos de Gemini seguido. Si el nodo
> tira error 404 de "modelo no disponible", entra al dropdown de **Model** en el nodo y elige el
> más nuevo disponible que diga "flash" y **no** diga "preview" (los preview pueden desaparecer sin
> aviso). Si tira error 503 "high demand", es saturación temporal de la capa gratis — reintenta, o
> activa **Retry On Fail** en la pestaña Settings del nodo.

Para parar n8n sin perder nada (workflow, credenciales): `docker compose stop` dentro de `n8n/`.
Para volver a levantarlo: `docker compose start`.

### 3. Probar con Postman

1. Importa `postman/Agenda-IA.postman_collection.json`.
2. En cada request, reemplaza la URL por la que copiaste del webhook de n8n (o edita la variable
   `webhook_url` de la colección).
3. Corre los requests de la carpeta **"n8n - Flujo del agente"** en orden — simulan una
   conversación real: saludo → pregunta de servicio → da nombre y teléfono → otra pregunta.
   Todos usan el mismo `usuario_id` para que la IA recuerde el contexto entre mensajes.
4. La carpeta **"Backend directo (debug)"** te deja pegarle al backend sin pasar por n8n, para
   descartar si un error es de la IA o del backend.

## Cómo está armado el agente (por si lo vas a tocar)

Dentro del nodo **AI Agent** en n8n:

- **System Message**: define el tono y las reglas (no inventar precios, pedir nombre/teléfono
  antes de ayudar, etc). Si quieres cambiar el comportamiento del bot, empieza por ahí.
- **Tools conectados** (puerto "Tool" del nodo): `registrar_lead` y `consultar_servicios`, cada uno
  es un nodo "HTTP Request Tool" que le pega al backend. El agente decide solo cuál usar según el
  mensaje del paciente — no hay lógica de "if" en ningún lado, es la IA la que interpreta.
- **Memoria**: nodo "Memoria de conversación", indexada por `usuario_id` — así cada paciente tiene
  su propio hilo de conversación aunque le escriban al mismo bot.

Para agregar una función nueva al agente (ej. agendar cita): crea el endpoint en el backend,
agrega un nuevo "HTTP Request Tool" en n8n apuntando a `http://host.docker.internal:3000/<ruta>`
(ojo: `host.docker.internal`, no `localhost`, porque n8n corre dentro de Docker), y descríbele al
tool en su campo "Description" cuándo debe usarlo — el agente lee esa descripción para decidir.

## Qué sigue (roadmap)

En orden de dificultad, ya definido con el dueño del proyecto:

1. **Google Calendar** — agregar tools `ver_disponibilidad` y `reservar_cita` usando la API de
   Google Calendar (OAuth por profesional). Es el más directo de los que faltan.
2. **Certificados en PDF** — tool que valide que el paciente sí asistió a la cita (consulta al
   backend), genera un PDF desde una plantilla HTML (ej. con Puppeteer) y lo envía por WhatsApp.
3. **Audio → texto** — los modelos de Gemini entienden audio de forma nativa, así que no
   necesariamente hace falta un paso de transcripción aparte (Whisper); hay que probar mandarle el
   audio directo desde el canal.
4. **Cotejo de comprobantes de pago contra correo del banco** — el más complejo de los cuatro:
   requiere un buzón de correo para las notificaciones bancarias, un parser distinto por banco, y
   lógica de match (monto + referencia + fecha) entre la imagen del comprobante y el correo. Dejar
   siempre una opción de aprobación manual del doctor como respaldo si el match automático falla.

Y en paralelo, migrar `backend/data/leads.txt` a una base de datos real (Postgres) apenas el
modelo de datos crezca más allá de leads y servicios — el archivo de texto fue una decisión
deliberada para ir rápido en el MVP, no para quedarse así.

## Seguridad / secretos

- La API key de Gemini vive **solo** dentro de la credencial de n8n (guardada en
  `n8n/data`, que está en `.gitignore` — nunca se sube al repo).
- `backend/data/leads.txt` tampoco se sube (son datos de pacientes, aunque sean de prueba).
- Si en algún momento conectas WhatsApp Cloud API o un banco de verdad, ese tipo de credenciales
  van en variables de entorno (`.env`, también ignorado por git), nunca hardcodeadas en el código.
