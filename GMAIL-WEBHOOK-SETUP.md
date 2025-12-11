# 📧 Gmail Webhook Integration - Guía de Configuración

## ✅ Lo que ya está configurado

### Google Cloud
- ✅ Pub/Sub Topic: `gmail-notifications`
- ✅ Push Subscription apuntando a Railway
- ✅ Gmail Watch activado
- ✅ OAuth Client ID y Secret creados
- ✅ Refresh Token generado

### Código
- ✅ Webhook endpoint: `/api/gmail-webhook`
- ✅ Sync endpoint: `/api/sync-slack-replies`
- ✅ Clientes de Gmail, Sheets y Slack
- ✅ Procesadores de emails de todos los bancos

---

## 🚀 Pasos para desplegar en Railway

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno en Railway

Ve a tu proyecto en Railway y agrega estas variables de entorno:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token

# Google Sheets
SPREADSHEET_ID=your-spreadsheet-id
SHEET_NAME=your-sheet-name

# Google Cloud Project
GOOGLE_CLOUD_PROJECT=your-project-id

# Slack (obtener de Secret Manager o directamente)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL_ID=C-your-channel-id

# Otras variables existentes
EXPENSES_CSV_URL=...
INCOMES_CSV_URL=...
PASSWORD_HASH=...
SESSION_SECRET=...
```

### 3. Obtener tokens de Slack

Tienes dos opciones:

#### Opción A: Usar Secret Manager (como en Apps Script)
Si dejas `SLACK_BOT_TOKEN` y `SLACK_CHANNEL_ID` vacíos, el código automáticamente intentará obtenerlos de Google Secret Manager.

**Requisito:** Necesitas configurar credenciales de Service Account en Railway:
1. Descarga el JSON de la Service Account que creaste
2. En Railway, agrega la variable: `GOOGLE_APPLICATION_CREDENTIALS_JSON` con el contenido completo del archivo JSON

#### Opción B: Usar variables de entorno directamente (más simple)
1. Ve a tu Apps Script
2. Ejecuta la función `testSlackToken()` para ver el token
3. O accede a Secret Manager manualmente:
   ```bash
   gcloud secrets versions access latest --secret="SLACK_BOT_TOKEN" --project=finanzaspersonales-480101
   gcloud secrets versions access latest --secret="SLACK_CHANNEL_ID" --project=finanzaspersonales-480101
   ```
4. Copia los valores y agrégalos como variables de entorno en Railway

**Recomendación:** Usa Opción B para empezar (más simple).

### 4. Desplegar en Railway

```bash
git add .
git commit -m "Add Gmail webhook integration"
git push
```

Railway automáticamente desplegará los cambios.

---

## 🧪 Probar la integración

### 1. Verificar que el webhook está activo

```bash
curl https://expense-tracking-dashboard-production.up.railway.app/api/gmail-webhook
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Gmail webhook endpoint is running",
  "timestamp": "..."
}
```

### 2. Probar con un correo real

Envíate un correo de prueba desde uno de tus bancos, o espera a que llegue una transacción real. El flujo debería ser:

1. 📧 Llega correo → Gmail
2. 🔔 Gmail notifica → Pub/Sub
3. 📥 Pub/Sub envía → Tu Railway webhook
4. 💻 Tu código procesa → Extrae datos → Escribe en Sheets → Notifica Slack

### 3. Ver logs en Railway

Ve a tu proyecto en Railway → Deployments → Logs

Deberías ver mensajes como:
```
📬 Notificación recibida de Pub/Sub
✓ Transacción extraída: {...}
✓ Notificación enviada a Slack. TS: ...
✓ Transacción guardada en fila ...
```

---

## 🔄 Sincronizar respuestas de Slack

El endpoint `/api/sync-slack-replies` busca descripciones en los hilos de Slack y las actualiza en Sheets.

### Opción 1: Llamarlo manualmente

```bash
curl -X POST https://expense-tracking-dashboard-production.up.railway.app/api/sync-slack-replies
```

### Opción 2: Configurar como Cron Job en Railway

1. Ve a tu proyecto en Railway
2. Click en "New" → "Cron Job"
3. Configura:
   - **Command:** `curl -X POST https://expense-tracking-dashboard-production.up.railway.app/api/sync-slack-replies`
   - **Schedule:** `*/10 * * * *` (cada 10 minutos)

---

## ⚠️ Notas importantes

### Gmail Watch expira cada 7 días

La configuración de Gmail Watch que hicimos expira cada 7 días. Necesitas renovarla ejecutando nuevamente:

```bash
curl -X POST 'https://gmail.googleapis.com/gmail/v1/users/me/watch' \
  -H 'Authorization: Bearer TU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "labelIds": ["INBOX"],
    "topicName": "projects/finanzaspersonales-480101/topics/gmail-notifications"
  }'
```

**Solución futura:** Podemos crear un endpoint que renueve automáticamente el watch antes de que expire.

### Rate limits de Slack

El código ya maneja reintentos automáticos con exponential backoff. Si llegas al rate limit, esperará y volverá a intentar.

---

## 🐛 Troubleshooting

### "Error obteniendo token de Slack"
- Verifica que las variables `SLACK_BOT_TOKEN` y `SLACK_CHANNEL_ID` estén configuradas
- O que la Service Account tenga permisos para Secret Manager

### "Error escribiendo en Sheets"
- Verifica que el `GOOGLE_REFRESH_TOKEN` sea válido
- Verifica que el `SPREADSHEET_ID` y `SHEET_NAME` sean correctos

### "No se reciben notificaciones"
- Verifica que Gmail Watch esté activo (puede haber expirado)
- Verifica los logs de Railway para ver si llegan las notificaciones de Pub/Sub
- Verifica que la Push Subscription esté apuntando a la URL correcta

---

## 📞 Próximos pasos opcionales

1. **Renovación automática de Gmail Watch:** Crear endpoint que renueve el watch cada 6 días
2. **Dashboard de monitoreo:** Ver estado de sincronización en la UI
3. **Notificaciones de errores:** Enviar a Slack si algo falla
4. **Soporte para más bancos:** Agregar más extractores de emails
