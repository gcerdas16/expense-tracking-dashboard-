import { google } from 'googleapis';

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

/**
 * Obtiene transacciones recientes para evitar duplicados
 */
export async function getRecentTransactions(hours: number = 24): Promise<Set<string>> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });

    const values = response.data.values || [];
    const recentKeys = new Set<string>();

    // Crear una key única por transacción: comercio+fecha+monto
    values.forEach((row) => {
      if (row.length >= 5) {
        const comercio = row[0]; // A
        const fecha = row[1];    // B
        const monto = row[4];    // E
        
        if (comercio && fecha && monto) {
          const key = `${comercio}|${fecha}|${monto}`.toLowerCase();
          recentKeys.add(key);
        }
      }
    });

    return recentKeys;
  } catch (error) {
    console.error('Error obteniendo transacciones recientes:', error);
    return new Set();
  }
}

/**
 * Genera una key única para una transacción
 */
export function generateTransactionKey(comercio: string, fecha: string, monto: number): string {
  return `${comercio}|${fecha}|${monto}`.toLowerCase();
}
