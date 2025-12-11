import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT!;

const SLACK_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
};

let cachedSlackToken: string | null = null;
let cachedChannelId: string | null = null;

/**
 * Obtiene el token de Slack desde Secret Manager o variable de entorno
 */
async function getSlackToken(): Promise<string> {
  // Si ya está en caché, devolverlo
  if (cachedSlackToken) {
    return cachedSlackToken;
  }

  // Intentar obtener desde variable de entorno primero
  if (process.env.SLACK_BOT_TOKEN) {
    cachedSlackToken = process.env.SLACK_BOT_TOKEN;
    return cachedSlackToken;
  }

  // Si no está en env, obtener desde Secret Manager
  try {
    const client = new SecretManagerServiceClient();
    const name = `projects/${GOOGLE_CLOUD_PROJECT}/secrets/SLACK_BOT_TOKEN/versions/latest`;
    
    const [version] = await client.accessSecretVersion({ name });
    const token = version.payload?.data?.toString();
    
    if (!token) {
      throw new Error('Token de Slack no encontrado en Secret Manager');
    }

    cachedSlackToken = token;
    return token;
  } catch (error) {
    console.error('Error obteniendo token de Slack:', error);
    throw new Error('No se pudo obtener el token de Slack');
  }
}

/**
 * Obtiene el ID del canal de Slack desde Secret Manager o variable de entorno
 */
async function getSlackChannelId(): Promise<string> {
  // Si ya está en caché, devolverlo
  if (cachedChannelId) {
    return cachedChannelId;
  }

  // Intentar obtener desde variable de entorno primero
  if (process.env.SLACK_CHANNEL_ID) {
    cachedChannelId = process.env.SLACK_CHANNEL_ID;
    return cachedChannelId;
  }

  // Si no está en env, obtener desde Secret Manager
  try {
    const client = new SecretManagerServiceClient();
    const name = `projects/${GOOGLE_CLOUD_PROJECT}/secrets/SLACK_CHANNEL_ID/versions/latest`;
    
    const [version] = await client.accessSecretVersion({ name });
    const channelId = version.payload?.data?.toString();
    
    if (!channelId) {
      throw new Error('Channel ID de Slack no encontrado en Secret Manager');
    }

    cachedChannelId = channelId;
    return channelId;
  } catch (error) {
    console.error('Error obteniendo Channel ID de Slack:', error);
    throw new Error('No se pudo obtener el Channel ID de Slack');
  }
}

/**
 * Función auxiliar para sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Envía una notificación a Slack con reintentos
 */
export async function sendSlackNotification(
  comercio: string,
  monto: number,
  banco: string,
  moneda: 'CRC' | 'USD'
): Promise<{ ok: boolean; ts?: string }> {
  const token = await getSlackToken();
  const channelId = await getSlackChannelId();

  const montoFormateado = monto.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const text = `*Nueva Transacción:* ${comercio}\n*Monto:* ${moneda} ${montoFormateado}\n*Banco:* ${banco}\n\n:point_down: *Para añadir una descripción, responde a este mensaje en un hilo.*`;

  let delayMs = SLACK_RETRY_CONFIG.initialDelayMs;

  for (let attempt = 1; attempt <= SLACK_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          channel: channelId,
          text,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        console.log(`✓ Mensaje enviado a Slack (intento ${attempt})`);
        return { ok: true, ts: data.ts };
      }

      if (response.status === 429) {
        console.log(`⚠ Rate limit (429) en intento ${attempt}. Esperando ${delayMs}ms...`);
        await sleep(delayMs);
        delayMs = Math.min(delayMs * SLACK_RETRY_CONFIG.backoffMultiplier, SLACK_RETRY_CONFIG.maxDelayMs);
        continue;
      }

      console.error(`✗ Error de Slack (intento ${attempt}):`, data);
      
      if (attempt < SLACK_RETRY_CONFIG.maxRetries) {
        await sleep(delayMs);
        delayMs = Math.min(delayMs * SLACK_RETRY_CONFIG.backoffMultiplier, SLACK_RETRY_CONFIG.maxDelayMs);
      }
    } catch (error) {
      console.error(`✗ Error al conectar (intento ${attempt}):`, error);
      
      if (attempt < SLACK_RETRY_CONFIG.maxRetries) {
        await sleep(delayMs);
        delayMs = Math.min(delayMs * SLACK_RETRY_CONFIG.backoffMultiplier, SLACK_RETRY_CONFIG.maxDelayMs);
      }
    }
  }

  console.error(`✗ Falló enviar mensaje después de ${SLACK_RETRY_CONFIG.maxRetries} intentos`);
  return { ok: false };
}

/**
 * Obtiene respuestas de un hilo de Slack con reintentos
 */
export async function getSlackThreadReplies(
  threadTs: string
): Promise<{ ok: boolean; messages?: any[]; error?: string }> {
  const token = await getSlackToken();
  const channelId = await getSlackChannelId();

  const url = `https://slack.com/api/conversations.replies?channel=${channelId}&ts=${threadTs}`;

  let delayMs = SLACK_RETRY_CONFIG.initialDelayMs;

  for (let attempt = 1; attempt <= SLACK_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 429) {
        console.log(`⚠ Rate limit (429) en intento ${attempt}`);
        return { ok: false, error: 'RATE_LIMITED' };
      }

      const data = await response.json();

      if (response.ok && data.ok) {
        console.log(`✓ Respuestas obtenidas (intento ${attempt})`);
        return { ok: true, messages: data.messages };
      }

      console.error(`✗ Error en Slack (intento ${attempt}):`, data.error);

      if (attempt < SLACK_RETRY_CONFIG.maxRetries) {
        await sleep(delayMs);
        delayMs = Math.min(delayMs * SLACK_RETRY_CONFIG.backoffMultiplier, SLACK_RETRY_CONFIG.maxDelayMs);
      }
    } catch (error) {
      console.error(`✗ Error al conectar (intento ${attempt}):`, error);

      if (attempt < SLACK_RETRY_CONFIG.maxRetries) {
        await sleep(delayMs);
        delayMs = Math.min(delayMs * SLACK_RETRY_CONFIG.backoffMultiplier, SLACK_RETRY_CONFIG.maxDelayMs);
      }
    }
  }

  console.error(`✗ Falló obtener respuestas después de ${SLACK_RETRY_CONFIG.maxRetries} intentos`);
  return { ok: false };
}
