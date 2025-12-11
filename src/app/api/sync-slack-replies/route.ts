import { NextRequest, NextResponse } from 'next/server';
import { getPendingRows, updateDescription } from '@/lib/sheets-client';
import { getSlackThreadReplies } from '@/lib/slack-client';

/**
 * Endpoint para sincronizar respuestas de Slack con Google Sheets
 * Se puede llamar manualmente o configurar como cron job
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronización de respuestas de Slack...');

    // Obtener filas pendientes (sin descripción)
    const pendingRows = await getPendingRows(5); // Límite de 5 por ejecución

    if (pendingRows.length === 0) {
      console.log('No hay filas pendientes para procesar');
      return NextResponse.json({ 
        success: true, 
        processed: 0,
        message: 'No hay respuestas pendientes'
      });
    }

    console.log(`Encontradas ${pendingRows.length} filas pendientes`);

    let processed = 0;
    let rateLimited = false;

    for (const { row, slackTs } of pendingRows) {
      console.log(`Procesando fila ${row}, Slack TS: ${slackTs}`);

      // Obtener respuestas del hilo de Slack
      const slackResponse = await getSlackThreadReplies(slackTs);

      if (slackResponse.error === 'RATE_LIMITED') {
        console.log('⚠ Rate limit alcanzado. Deteniendo sincronización.');
        rateLimited = true;
        break;
      }

      if (!slackResponse.ok || !slackResponse.messages) {
        console.log(`⚠ No se pudieron obtener respuestas para fila ${row}`);
        continue;
      }

      // Si hay más de 1 mensaje (el original + respuestas), tomar la primera respuesta
      if (slackResponse.messages.length > 1) {
        const firstReply = slackResponse.messages[1].text;
        
        // Actualizar la descripción en Sheets
        const success = await updateDescription(row, firstReply);

        if (success) {
          console.log(`✓ Descripción "${firstReply}" agregada a la fila ${row}`);
          processed++;
        }
      } else {
        console.log(`⚠ No se encontraron respuestas en fila ${row}`);
      }
    }

    const message = rateLimited
      ? `Rate limit alcanzado. ${processed} de ${pendingRows.length} procesadas.`
      : `${processed} descripciones sincronizadas exitosamente`;

    console.log(`✓ Sincronización completada. ${message}`);

    return NextResponse.json({
      success: true,
      processed,
      pending: pendingRows.length - processed,
      rateLimited,
      message
    });

  } catch (error) {
    console.error('Error sincronizando respuestas de Slack:', error);
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
 * Endpoint GET para verificar el estado
 */
export async function GET() {
  try {
    const pendingRows = await getPendingRows(5);
    
    return NextResponse.json({ 
      status: 'ok',
      pendingCount: pendingRows.length,
      message: 'Slack sync endpoint is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
