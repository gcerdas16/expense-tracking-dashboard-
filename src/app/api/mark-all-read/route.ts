import { NextResponse } from 'next/server';
import { searchUnreadBankEmails, markEmailAsRead } from '@/lib/gmail-client';

/**
 * Marca todos los correos bancarios no leídos como leídos
 * Usar SOLO para limpiar correos duplicados
 */
export async function POST() {
  try {
    console.log('🧹 Marcando todos los correos bancarios como leídos...');

    const unreadEmails = await searchUnreadBankEmails();

    if (unreadEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay correos sin leer',
        marked: 0
      });
    }

    console.log(`Encontrados ${unreadEmails.length} correos sin leer`);

    let marked = 0;
    const errors: string[] = [];

    for (const messageId of unreadEmails) {
      try {
        const success = await markEmailAsRead(messageId);
        if (success) {
          console.log(`✓ Correo ${messageId} marcado como leído`);
          marked++;
        } else {
          errors.push(`No se pudo marcar ${messageId}`);
        }
      } catch (error) {
        console.error(`Error marcando ${messageId}:`, error);
        errors.push(`Error en ${messageId}: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    console.log(`✓ Marcados ${marked} de ${unreadEmails.length} correos`);

    return NextResponse.json({
      success: true,
      message: `${marked} correos marcados como leídos`,
      total: unreadEmails.length,
      marked,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error marcando correos como leídos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Usa POST para marcar todos los correos bancarios como leídos',
    warning: 'Esto marcará TODOS los correos no leídos de bancos'
  });
}
