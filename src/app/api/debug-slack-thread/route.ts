import { NextRequest, NextResponse } from 'next/server';
import { getSlackThreadReplies } from '@/lib/slack-client';

/**
 * Debug endpoint para ver qué hay en un hilo específico de Slack
 * Uso: /api/debug-slack-thread?ts=1765486958.051649
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ts = searchParams.get('ts');

    if (!ts) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Falta parámetro ts. Uso: /api/debug-slack-thread?ts=1765486958.051649' 
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Buscando respuestas para thread: ${ts}`);

    const result = await getSlackThreadReplies(ts);

    if (result.error === 'RATE_LIMITED') {
      return NextResponse.json({
        success: false,
        error: 'Rate limited por Slack'
      });
    }

    if (!result.ok) {
      return NextResponse.json({
        success: false,
        error: 'No se pudieron obtener respuestas',
        details: result
      });
    }

    const messages = result.messages || [];
    
    // Extraer información útil
    const messageDetails = messages.map((msg: any, index: number) => ({
      index,
      text: msg.text,
      user: msg.user,
      ts: msg.ts,
      isOriginal: index === 0
    }));

    const hasReplies = messages.length > 1;
    const firstReply = hasReplies ? messages[1].text : null;

    return NextResponse.json({
      success: true,
      threadTs: ts,
      totalMessages: messages.length,
      hasReplies,
      firstReply,
      allMessages: messageDetails
    });

  } catch (error) {
    console.error('Error en debug de thread:', error);
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
