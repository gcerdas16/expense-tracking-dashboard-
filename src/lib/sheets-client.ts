import { google } from 'googleapis';
import type { TransactionData } from './email-processor';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;
const SHEET_NAME = process.env.SHEET_NAME!;

// Estructura de columnas
const COLUMNAS = {
  COMERCIO: 1,           // A
  FECHA: 2,              // B
  MONEDA: 3,             // C
  MONTO_ORIGINAL_USD: 4, // D
  MONTO: 5,              // E
  CATEGORIA: 6,          // F
  DESCRIPCION: 7,        // G
  BANCO: 8,              // H
  SLACK_TS: 9            // I
};

/**
 * Escribe una transacción en Google Sheets y devuelve el número de fila
 */
export async function writeTransactionToSheet(
  transaction: TransactionData,
  slackTs: string
): Promise<number | null> {
  try {
    // Obtener la última fila
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const newRow = (response.data.values?.length || 1) + 1;

    // Preparar los valores
    const values: (string | number | undefined)[][] = [[]];
    values[0][COLUMNAS.COMERCIO - 1] = transaction.comercio;
    values[0][COLUMNAS.FECHA - 1] = transaction.fecha;
    values[0][COLUMNAS.MONEDA - 1] = transaction.moneda;
    values[0][COLUMNAS.BANCO - 1] = transaction.banco;
    values[0][COLUMNAS.SLACK_TS - 1] = `'${slackTs}`;

    if (transaction.moneda === 'USD') {
      values[0][COLUMNAS.MONTO_ORIGINAL_USD - 1] = transaction.monto;
      values[0][COLUMNAS.MONTO - 1] = `=D${newRow}*515`;
    } else {
      values[0][COLUMNAS.MONTO_ORIGINAL_USD - 1] = '';
      values[0][COLUMNAS.MONTO - 1] = transaction.monto;
    }

    // Escribir los valores
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${newRow}:I${newRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    // Agregar fórmula de categoría (usando punto y coma para configuración regional española)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!F${newRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[`=VLOOKUP(A${newRow};'Base de Comercios'!A:B;2;0)`]],
      },
    });

    console.log(`✓ Transacción escrita en fila ${newRow}`);
    return newRow;
  } catch (error) {
    console.error('Error escribiendo en Sheets:', error);
    return null;
  }
}

/**
 * Obtiene filas pendientes (con slack_ts pero sin descripción)
 */
export async function getPendingRows(limit: number = 5): Promise<Array<{ row: number; slackTs: string }>> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:I`,
    });

    const values = response.data.values || [];
    const pending: Array<{ row: number; slackTs: string }> = [];

    // Recorrer de abajo hacia arriba
    for (let i = values.length - 1; i >= 1 && pending.length < limit; i--) {
      const row = values[i];
      const slackTs = row[COLUMNAS.SLACK_TS - 1];
      const descripcion = row[COLUMNAS.DESCRIPCION - 1];

      if (slackTs && !descripcion) {
        const cleanTs = slackTs.toString().replace("'", "");
        pending.push({ row: i + 1, slackTs: cleanTs });
      }
    }

    return pending;
  } catch (error) {
    console.error('Error obteniendo filas pendientes:', error);
    return [];
  }
}

/**
 * Actualiza la descripción de una transacción
 */
export async function updateDescription(row: number, description: string): Promise<boolean> {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!G${row}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[description]],
      },
    });

    console.log(`✓ Descripción actualizada en fila ${row}`);
    return true;
  } catch (error) {
    console.error('Error actualizando descripción:', error);
    return false;
  }
}
