import { NextRequest, NextResponse } from 'next/server';
import { getEmailById, markEmailAsRead } from '@/lib/gmail-client';
import { processEmail } from '@/lib/email-processor';
import { writeTransactionToSheet } from '@/lib/sheets-client';
import { sendSlackNotification } from '@/lib/slack-client';
import { getRecentTransactions, generateTransactionKey } from '@/lib/processed-emails';

interface PubSubMessage {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

// Cache simple para evitar procesar el mismo correo múltiples veces
const processedEmails = new Set<string>();

/**
 * Endpoint que recibe notificaciones de Google Pub/Sub cuando llegan correos nuevos
 */
export async function POST(request: NextRequest) {
  try {
    const body: PubSubMessage = await request.json();
    
    console.log('📬 Notificación recibida de Pub/Sub');

    // Obtener transacciones recientes de Sheets para evitar duplicados
    const recentTransactions = await getRecentTransactions(24); // Últimas 24 horas
    console.log(`Transacciones recientes en Sheet: ${recentTransactions.size}`);

    // Decodificar el mensaje de Pub/Sub
    const messageData = JSON.parse(
      Buffer.from(body.message.data, 'base64').toString('utf-8')
    );

    console.log('Mensaje decodificado:', messageData);

    // Buscar correos no leídos de bancos
    const { searchUnreadBankEmails } = await import('@/lib/gmail-client');
    const unreadEmails = await searchUnreadBankEmails();

    if (unreadEmails.length === 0) {
      console.log('No hay correos bancarios sin leer');
      return NextResponse.json({ success: true, processed: 0 });
    }

    let processed = 0;
    const errors: string[] = [];

    // Procesar cada correo no leído
    for (const messageId of unreadEmails) {
      // Verificar si ya procesamos este correo en esta ejecución
      if (processedEmails.has(messageId)) {
        console.log(`Correo ${messageId} ya fue procesado en esta sesión, saltando...`);
        continue;
      }

      console.log(`Procesando correo: ${messageId}`);
      
      try {
        const email = await getEmailById(messageId);
        
        if (!email) {
          console.log(`No se pudo obtener el correo ${messageId}`);
          errors.push(`No se pudo obtener correo ${messageId}`);
          continue;
        }

        // Procesar el email para extraer datos de transacción
        const transaction = processEmail(email.from, email.body);

        if (!transaction) {
          console.log(`Correo de ${email.from} no contiene datos procesables`);
          // Marcar como leído si no es procesable
          await markEmailAsRead(messageId);
          processedEmails.add(messageId);
          continue;
        }

        console.log('✓ Transacción extraída:', transaction);

        // Verificar si esta transacción ya existe en Sheets
      const transactionKey = generateTransactionKey(transaction.comercio, transaction.fecha, transaction.monto);
      if (recentTransactions.has(transactionKey)) {
        console.log(`⚠ Transacción duplicada detectada: ${transactionKey}`);
        console.log('Saltando... (ya existe en Sheets)');
        await markEmailAsRead(messageId);
        processedEmails.add(messageId);
        continue;
      }

      // Enviar notificación a Slack PRIMERO
        const slackResponse = await sendSlackNotification(
          transaction.comercio,
          transaction.monto,
          transaction.banco,
          transaction.moneda
        );

        if (!slackResponse.ok || !slackResponse.ts) {
          console.error('No se pudo enviar notificación a Slack');
          errors.push(`No se pudo notificar a Slack: ${transaction.comercio}`);
          continue;
        }

        console.log(`✓ Notificación enviada a Slack. TS: ${slackResponse.ts}`);

        // Escribir en Google Sheets
        const row = await writeTransactionToSheet(transaction, slackResponse.ts);

        if (!row) {
          console.error('No se pudo escribir en Google Sheets');
          errors.push(`No se pudo escribir en Sheets: ${transaction.comercio}`);
          continue;
        }

        console.log(`✓ Transacción guardada en fila ${row}`);

        // SOLO marcar como leído si todo fue exitoso
        const marked = await markEmailAsRead(messageId);
        if (marked) {
          console.log(`✓ Correo ${messageId} marcado como leído`);
          processedEmails.add(messageId);
          processed++;
        } else {
          console.error(`⚠ No se pudo marcar correo ${messageId} como leído`);
          errors.push(`No se pudo marcar como leído: ${messageId}`);
        }

      } catch (emailError) {
        console.error(`Error procesando correo ${messageId}:`, emailError);
        errors.push(`Error en correo ${messageId}: ${emailError instanceof Error ? emailError.message : 'Unknown'}`);
        continue;
      }
    }

    console.log(`✓ Procesamiento completado. ${processed} transacciones procesadas`);
    
    if (errors.length > 0) {
      console.error('Errores durante el procesamiento:', errors);
    }

    return NextResponse.json({ 
      success: true, 
      processed,
      errors: errors.length > 0 ? errors : undefined,
      message: `${processed} transacciones procesadas exitosamente${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
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
    timestamp: new Date().toISOString(),
    processedEmailsInCache: processedEmails.size
  });
}
