import { NextRequest, NextResponse } from 'next/server';
import { getEmailById, markEmailAsRead } from '@/lib/gmail-client';
import { processEmail } from '@/lib/email-processor';
import { writeTransactionToSheet } from '@/lib/sheets-client';
import { sendSlackNotification } from '@/lib/slack-client';

interface PubSubMessage {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

/**
 * Endpoint que recibe notificaciones de Google Pub/Sub cuando llegan correos nuevos
 */
export async function POST(request: NextRequest) {
  try {
    const body: PubSubMessage = await request.json();
    
    console.log('📬 Notificación recibida de Pub/Sub');

    // Decodificar el mensaje de Pub/Sub
    const messageData = JSON.parse(
      Buffer.from(body.message.data, 'base64').toString('utf-8')
    );

    console.log('Mensaje decodificado:', messageData);

    // El mensaje contiene historyId, pero necesitamos obtener el email más reciente
    // Por ahora, buscamos correos no leídos de bancos
    const { searchUnreadBankEmails } = await import('@/lib/gmail-client');
    const unreadEmails = await searchUnreadBankEmails();

    if (unreadEmails.length === 0) {
      console.log('No hay correos bancarios sin leer');
      return NextResponse.json({ success: true, processed: 0 });
    }

    let processed = 0;

    // Procesar cada correo no leído
    for (const messageId of unreadEmails) {
      console.log(`Procesando correo: ${messageId}`);
      
      const email = await getEmailById(messageId);
      
      if (!email) {
        console.log(`No se pudo obtener el correo ${messageId}`);
        continue;
      }

      // Procesar el email para extraer datos de transacción
      const transaction = processEmail(email.from, email.body);

      if (!transaction) {
        console.log(`Correo de ${email.from} no contiene datos procesables`);
        await markEmailAsRead(messageId);
        continue;
      }

      console.log('✓ Transacción extraída:', transaction);

      // Enviar notificación a Slack
      const slackResponse = await sendSlackNotification(
        transaction.comercio,
        transaction.monto,
        transaction.banco,
        transaction.moneda
      );

      if (!slackResponse.ok || !slackResponse.ts) {
        console.error('No se pudo enviar notificación a Slack');
        continue;
      }

      console.log(`✓ Notificación enviada a Slack. TS: ${slackResponse.ts}`);

      // Escribir en Google Sheets
      const row = await writeTransactionToSheet(transaction, slackResponse.ts);

      if (!row) {
        console.error('No se pudo escribir en Google Sheets');
        continue;
      }

      console.log(`✓ Transacción guardada en fila ${row}`);

      // Marcar el correo como leído
      await markEmailAsRead(messageId);
      
      processed++;
    }

    console.log(`✓ Procesamiento completado. ${processed} transacciones procesadas`);

    return NextResponse.json({ 
      success: true, 
      processed,
      message: `${processed} transacciones procesadas exitosamente`
    });

  } catch (error) {
    console.error('Error procesando webhook de Gmail:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint GET para verificar que el webhook está funcionando
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Gmail webhook endpoint is running',
    timestamp: new Date().toISOString()
  });
}
