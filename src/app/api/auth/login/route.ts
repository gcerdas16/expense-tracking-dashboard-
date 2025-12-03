import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// ==================================================================================
// CONFIGURACIÓN DE CONTRASEÑA
// ==================================================================================
// Para desarrollo local: la contraseña es "dashboard123"
// Para producción (Railway): configura PASSWORD_HASH en las variables de entorno
// 
// Genera un nuevo hash con:
// node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TuPassword', 10).then(h => console.log(h));"
// ==================================================================================

const DEV_PASSWORD_HASH = '$2b$10$VnIKkKmygeobUNnaKuxsCe3HrREyQTzWz28PDFNv4DBJMigjyZu6C'; // dashboard123
const PASSWORD_HASH = process.env.PASSWORD_HASH || DEV_PASSWORD_HASH;

export async function POST(request: Request) {
    try {
        const clientIp = getClientIp(request);
        const rateLimit = checkRateLimit(clientIp, {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000
        });

        if (!rateLimit.allowed) {
            const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
            return NextResponse.json(
                { 
                    error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutesLeft} minutos.`,
                    retryAfter: rateLimit.resetTime 
                },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
                    }
                }
            );
        }

        const { password } = await request.json();
        const isValid = await bcrypt.compare(password, PASSWORD_HASH);

        if (!isValid) {
            return NextResponse.json(
                { 
                    error: 'Contraseña incorrecta',
                    attemptsRemaining: rateLimit.remaining 
                },
                { status: 401 }
            );
        }

        await createSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error en login:', error);
        return NextResponse.json(
            { error: 'Error en el servidor' },
            { status: 500 }
        );
    }
}
