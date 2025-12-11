import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Debug endpoint para ver todos los correos de Promerica
 */
export async function GET() {
  try {
    // Buscar TODOS los correos de Promerica (leídos y no leídos)
    const query = 'from:info@promerica.fi.cr newer_than:7d'; // Últimos 7 días
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50,
    });

    const messages = response.data.messages || [];
    
    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron correos de Promerica en los últimos 7 días',
        count: 0
      });
    }

    // Obtener detalles de cada correo
    const details = [];
    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });

      const headers = detail.data.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      const labelIds = detail.data.labelIds || [];
      const isUnread = labelIds.includes('UNREAD');

      details.push({
        id: msg.id,
        threadId: msg.threadId,
        from,
        subject,
        date,
        isUnread,
        labelIds
      });
    }

    // Agrupar por thread
    const threads: Record<string, any[]> = {};
    details.forEach(detail => {
      if (!threads[detail.threadId!]) {
        threads[detail.threadId!] = [];
      }
      threads[detail.threadId!].push(detail);
    });

    return NextResponse.json({
      success: true,
      totalMessages: details.length,
      totalThreads: Object.keys(threads).length,
      threads: Object.entries(threads).map(([threadId, msgs]) => ({
        threadId,
        messageCount: msgs.length,
        messages: msgs
      })),
      allMessages: details
    });

  } catch (error) {
    console.error('Error en debug:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
