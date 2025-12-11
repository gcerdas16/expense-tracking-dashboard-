import { NextResponse } from 'next/server';
import { writeTransactionToSheet } from '@/lib/sheets-client';

/**
 * Prueba escribir una transacción de prueba en Sheets
 */
export async function POST() {
  try {
    console.log('🧪 Probando escritura en Google Sheets...');

    // Transacción de prueba
    const testTransaction = {
      comercio: 'TEST COMERCIO',
      fecha: '10/12/2025',
      monto: 1000,
      moneda: 'CRC' as const,
      banco: 'TEST'
    };

    // Timestamp de Slack de prueba
    const testSlackTs = '1234567890.123456';

    console.log('Escribiendo transacción de prueba:', testTransaction);

    const row = await writeTransactionToSheet(testTransaction, testSlackTs);

    if (row) {
      console.log(`✓ Transacción de prueba escrita en fila ${row}`);
      return NextResponse.json({
        success: true,
        message: `Transacción de prueba escrita exitosamente en fila ${row}`,
        row,
        transaction: testTransaction
      });
    } else {
      console.error('✗ No se pudo escribir la transacción');
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo escribir en Sheets'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error en test de escritura:', error);
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

export async function GET() {
  return NextResponse.json({
    message: 'Usa POST para probar escritura en Sheets',
    warning: 'Esto escribirá una fila de prueba en tu hoja'
  });
}
