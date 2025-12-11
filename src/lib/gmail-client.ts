import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

// Configurar el refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export interface EmailData {
  messageId: string;
  from: string;
  subject: string;
  body: string;
  date: string;
}

/**
 * Obtiene los detalles de un mensaje de Gmail
 */
export async function getEmailById(messageId: string): Promise<EmailData | null> {
  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    const headers = message.payload?.headers || [];
    
    const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '';
    const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || '';

    // Extraer el body (puede estar en diferentes formatos)
    let body = '';
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload?.parts) {
      // Buscar la parte HTML del email
      const htmlPart = message.payload.parts.find(
        (part) => part.mimeType === 'text/html'
      );
      if (htmlPart?.body?.data) {
        body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
      }
    }

    return {
      messageId,
      from,
      subject,
      body,
      date,
    };
  } catch (error) {
    console.error('Error obteniendo email:', error);
    return null;
  }
}

/**
 * Busca correos no leídos de bancos específicos
 */
export async function searchUnreadBankEmails(): Promise<string[]> {
  try {
    const query = 'is:unread in:inbox (from:bcrtarjestcta@bancobcr.com OR from:notificacion@notificacionesbaccr.com OR from:info@promerica.fi.cr OR from:informacion@credix.com OR from:mensajero@bancobcr.com)';
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50, // Aumentado para procesar más correos
    });

    return response.data.messages?.map((m) => m.id!) || [];
  } catch (error) {
    console.error('Error buscando emails:', error);
    return [];
  }
}

/**
 * Marca un email como leído
 */
export async function markEmailAsRead(messageId: string): Promise<boolean> {
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
    return true;
  } catch (error) {
    console.error('Error marcando email como leído:', error);
    return false;
  }
}
