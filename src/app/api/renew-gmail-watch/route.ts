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

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT!;
const TOPIC_NAME = `projects/${GOOGLE_CLOUD_PROJECT}/topics/gmail-notifications`;

/**
 * Renueva la suscripción de Gmail Watch
 * Este endpoint debe ejecutarse cada 6 días mediante un cron job
 */
export async function POST() {
  try {
    console.log('🔄 Renovando Gmail Watch...');

    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'],
        topicName: TOPIC_NAME,
      },
    });

    const historyId = response.data.historyId;
    const expiration = response.data.expiration;

    // Calcular cuándo expira
    const expirationDate = expiration ? new Date(parseInt(expiration)) : null;
    const daysUntilExpiration = expirationDate 
      ? Math.floor((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    console.log(`✓ Gmail Watch renovado exitosamente`);
    console.log(`History ID: ${historyId}`);
    console.log(`Expira: ${expirationDate?.toISOString()}`);
    console.log(`Días hasta expiración: ${daysUntilExpiration}`);

    return NextResponse.json({
      success: true,
      message: 'Gmail Watch renovado exitosamente',
      historyId,
      expiration: expirationDate?.toISOString(),
      daysUntilExpiration,
    });

  } catch (error) {
    console.error('Error renovando Gmail Watch:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint GET - también ejecuta la renovación (para cron jobs que solo soportan GET)
 */
export async function GET() {
  // Reutilizar la lógica de POST
  return POST();
}
