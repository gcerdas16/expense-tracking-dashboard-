import { NextResponse } from 'next/server';
import { searchUnreadBankEmails, getEmailById } from '@/lib/gmail-client';
import { processEmail } from '@/lib/email-processor';

/**
 * Endpoint de prueba para verificar que todo funciona sin escribir en Sheets
 */
export async function GET() {
  try {
    console.log('🧪 Iniciando test de procesamiento de Gmail...');

    // 1. Buscar correos no leídos
    const unreadEmails = await searchUnreadBankEmails();
    console.log(`Encontrados ${unreadEmails.length} correos no leídos`);

    if (unreadEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay correos bancarios sin leer',
        unreadCount: 0
      });
    }

    const results = [];

    // 2. Procesar cada correo (solo mostrar info, no escribir)
    for (const messageId of unreadEmails.slice(0, 3)) { // Solo los primeros 3
      console.log(`Procesando correo: ${messageId}`);
      
      const email = await getEmailById(messageId);
      
      if (!email) {
        results.push({
          messageId,
          success: false,
          error: 'No se pudo obtener el correo'
        });
        continue;
      }

      const transaction = processEmail(email.from, email.body);

      if (!transaction) {
        results.push({
          messageId,
          from: email.from,
          success: false,
          error: 'No se pudo extraer datos de transacción'
        });
        continue;
      }

      results.push({
        messageId,
        from: email.from,
        success: true,
        transaction
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test completado',
      unreadCount: unreadEmails.length,
      processed: results.length,
      results,
      config: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✓ Configurado' : '✗ Falta',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✓ Configurado' : '✗ Falta',
        GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN ? '✓ Configurado' : '✗ Falta',
        SPREADSHEET_ID: process.env.SPREADSHEET_ID ? '✓ Configurado' : '✗ Falta',
        SHEET_NAME: process.env.SHEET_NAME || '✗ Falta',
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN ? '✓ Configurado' : '✗ Falta',
        SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID ? '✓ Configurado' : '✗ Falta',
      }
    });

  } catch (error) {
    console.error('Error en test:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
