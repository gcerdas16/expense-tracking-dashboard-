export interface TransactionData {
  comercio: string;
  fecha: string;
  monto: number;
  moneda: 'CRC' | 'USD';
  banco: string;
}

/**
 * Extrae datos de tarjeta BCR del HTML
 */
function extractBcrTarjetaFromHTML(htmlBody: string): TransactionData | null {
  const regex = /<td class="datos">([\d\/]+\s[\d:]+)<\/td>[\s\S]*?<td class="datos-num">([\d,]+\.\d{2})<\/td>[\s\S]*?<td[^>]+>([^<]+CR)<\/td>/i;
  const match = htmlBody.match(regex);
  
  if (!match) return null;
  
  const fecha = match[1].trim().split(' ')[0];
  const monto = parseFloat(match[2].trim().replace(/,/g, ''));
  const comercio = match[3].trim();
  
  return { fecha, monto, comercio, moneda: 'CRC', banco: 'BCR' };
}

/**
 * Extrae datos de BAC del HTML
 */
function extractBacDataFromHTML(htmlBody: string): TransactionData | null {
  try {
    // Intentar nuevo formato primero
    const nuevoMontoRegex = />Monto:<\/p>[\s\S]*?<p>\s*(USD|CRC)\s*([\d,]+\.\d{2})\s*<\/p>/i;
    const montoMatch = htmlBody.match(nuevoMontoRegex);

    if (montoMatch) {
      const comercioRegex = />Comercio:<\/p>[\s\S]*?<p>\s*([^<]+)\s*<\/p>/i;
      const fechaRegex = />Fecha:<\/p>[\s\S]*?<p>\s*([^<]+)\s*<\/p>/i;
      
      const comercioMatch = htmlBody.match(comercioRegex);
      const fechaMatch = htmlBody.match(fechaRegex);

      if (!comercioMatch || !fechaMatch) return null;

      const comercio = comercioMatch[1].trim();
      const moneda = montoMatch[1].trim().toUpperCase() as 'USD' | 'CRC';
      const monto = parseFloat(montoMatch[2].replace(/,/g, ''));
      
      const fechaTexto = fechaMatch[1].trim();
      const partes = fechaTexto.replace(/,/g, '').split(' ');
      const meses: Record<string, string> = {
        Ene: '01', Feb: '02', Mar: '03', Abr: '04',
        May: '05', Jun: '06', Jul: '07', Ago: '08',
        Sep: '09', Oct: '10', Nov: '11', Dic: '12'
      };
      
      const dia = partes[1].padStart(2, '0');
      const mes = meses[partes[0]];
      const anio = partes[2];
      const fecha = `${dia}/${mes}/${anio}`;

      return { fecha, monto, comercio, moneda, banco: 'BAC' };
    }
  } catch {
    console.error('Error procesando nuevo formato BAC');
  }

  // Intentar formato antiguo
  try {
    const comercioRegex = /Comercio:<\/p>[\s\S]*?<p>([^<]+)<\/p>/i;
    const fechaRegex = /Fecha:<\/p>[\s\S]*?<p>([^<]+)<\/p>/i;
    const montoRegex = /Monto:<\/p>[\s\S]*?<p>[^>]*?([\d,]+\.\d{2})<\/p>/i;
    
    const comercioMatch = htmlBody.match(comercioRegex);
    const fechaMatch = htmlBody.match(fechaRegex);
    const montoMatch = htmlBody.match(montoRegex);

    if (comercioMatch && fechaMatch && montoMatch) {
      const comercio = comercioMatch[1].trim();
      const monto = parseFloat(montoMatch[1].replace(/,/g, ''));
      const fechaTexto = fechaMatch[1].trim();
      
      const meses: Record<string, string> = {
        Ene: '01', Feb: '02', Mar: '03', Abr: '04',
        May: '05', Jun: '06', Jul: '07', Ago: '08',
        Sep: '09', Oct: '10', Nov: '11', Dic: '12'
      };
      
      const partes = fechaTexto.replace(/,/g, '').split(' ');
      const fecha = `${partes[1]}/${meses[partes[0]]}/${partes[2]}`;
      
      return { fecha, monto, comercio, moneda: 'CRC', banco: 'BAC' };
    }
  } catch {
    console.error('Error procesando formato antiguo BAC');
  }

  return null;
}

/**
 * Extrae datos de Promerica del HTML
 */
function extractPromericaDataFromHTML(htmlBody: string): TransactionData | null {
  let decodedBody = htmlBody;
  
  try {
    if (!htmlBody.includes('</html>')) {
      decodedBody = Buffer.from(htmlBody.replace(/(\r\n|\n|\r)/gm, ''), 'base64').toString('utf-8');
    }
  } catch {
    console.error('No se pudo decodificar Promerica, usando original');
  }
  
  const comercioRegex = />\s*Comercio\s*<\/td>[\s\S]*?<td[^>]+>([^<]+)</i;
  const fechaRegex = />\s*Fecha\/hora\s*<\/td>[\s\S]*?<td[^>]+>\s*([^<]+)\s*</i;
  const montoRegex = />\s*Monto\s*<\/td>[\s\S]*?<strong>\s*(USD|CRC):\s*([\d,]+\.?\d*)\s*<\/strong>/i;
  
  const comercioMatch = decodedBody.match(comercioRegex);
  const fechaMatch = decodedBody.match(fechaRegex);
  const montoMatch = decodedBody.match(montoRegex);
  
  if (!comercioMatch || !fechaMatch || !montoMatch) return null;
  
  const comercio = comercioMatch[1].trim();
  const moneda = montoMatch[1].trim().toUpperCase() as 'USD' | 'CRC';
  const monto = parseFloat(montoMatch[2].trim().replace(/,/g, ''));
  const fechaTexto = fechaMatch[1].trim();
  
  const meses: Record<string, string> = {
    ene: '01', feb: '02', mar: '03', abr: '04',
    may: '05', jun: '06', jul: '07', ago: '08',
    sep: '09', oct: '10', nov: '11', dic: '12'
  };
  
  const partesFecha = fechaTexto.split('/')[0].trim().split(' ');
  const dia = partesFecha[0].padStart(2, '0');
  const mes = meses[partesFecha[1].toLowerCase()];
  const anio = partesFecha[2];
  const fecha = `${dia}/${mes}/${anio}`;
  
  return { fecha, monto, comercio, moneda, banco: 'PROMERICA' };
}

/**
 * Extrae datos de Credix del HTML
 */
function extractCredixDataFromHTML(htmlBody: string): TransactionData | null {
  const comercioRegex = /<strong>Comercio:<\/strong>\s*([^<\n\r]+)/i;
  const fechaRegex = /<strong>Fecha:<\/strong>\s*([^<\n\r]+)/i;
  const montoRegex = /<strong>Monto:<\/strong>\s*([^<\n\r]+)/i;
  const monedaRegex = /<strong>Moneda:<\/strong>\s*(DOLARES|COLONES)/i;

  const comercioMatch = htmlBody.match(comercioRegex);
  const fechaMatch = htmlBody.match(fechaRegex);
  const montoMatch = htmlBody.match(montoRegex);
  const monedaMatch = htmlBody.match(monedaRegex);

  if (!comercioMatch || !fechaMatch || !montoMatch || !monedaMatch) return null;

  const comercio = comercioMatch[1].trim();
  const fecha = fechaMatch[1].trim();
  const monto = parseFloat(montoMatch[1].trim().replace(/\s/g, '').replace(',', '.'));
  
  const moneda = monedaMatch[1].toUpperCase().trim() === 'DOLARES' ? 'USD' : 'CRC';

  return { fecha, monto, comercio, moneda, banco: 'CREDIX' };
}

/**
 * Extrae datos de SINPE Móvil BCR del HTML
 */
function extractSinpeMovilBCRDataFromHTML(htmlBody: string): TransactionData | null {
  const comercioRegex = /Nombre cliente Destino:\s*([^<]+)/i;
  const fechaRegex = /Esta transacci(?:&oacute;|ó)n fue realizada el\s*([\d\/]+)\s*a las/i;
  const montoRegex = />Monto:\s*([\d,]+\.\d{2})/;
  
  const comercioMatch = htmlBody.match(comercioRegex);
  const fechaMatch = htmlBody.match(fechaRegex);
  const montoMatch = htmlBody.match(montoRegex);
  
  if (!comercioMatch || !fechaMatch || !montoMatch) return null;
  
  const comercio = comercioMatch[1].trim();
  const fecha = fechaMatch[1].trim();
  const monto = parseFloat(montoMatch[1].trim().replace(/,/g, ''));
  
  return { fecha, monto, comercio, moneda: 'CRC', banco: 'SINPE MOVIL BCR' };
}

/**
 * Procesa un email y extrae datos de transacción
 */
export function processEmail(from: string, htmlBody: string): TransactionData | null {
  const sender = from.toLowerCase();
  
  if (sender.includes('bcrtarjestcta@bancobcr.com')) {
    return extractBcrTarjetaFromHTML(htmlBody);
  } else if (sender.includes('notificacion@notificacionesbaccr.com')) {
    return extractBacDataFromHTML(htmlBody);
  } else if (sender.includes('info@promerica.fi.cr')) {
    return extractPromericaDataFromHTML(htmlBody);
  } else if (sender.includes('informacion@credix.com')) {
    return extractCredixDataFromHTML(htmlBody);
  } else if (sender.includes('mensajero@bancobcr.com')) {
    return extractSinpeMovilBCRDataFromHTML(htmlBody);
  }
  
  return null;
}
