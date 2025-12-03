// Sistema simple de rate limiting en memoria
// Para producción, considera usar Redis o similar

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Verifica si una IP/identificador está dentro del límite de intentos
 * @param identifier - IP o identificador único
 * @param config - Configuración del rate limit
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Si no existe o ya expiró, crear nueva entrada
    if (!entry || now > entry.resetTime) {
        const resetTime = now + config.windowMs;
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime
        });
        return {
            allowed: true,
            remaining: config.maxAttempts - 1,
            resetTime
        };
    }

    // Si existe y no ha expirado
    if (entry.count >= config.maxAttempts) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime
        };
    }

    // Incrementar contador
    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
        allowed: true,
        remaining: config.maxAttempts - entry.count,
        resetTime: entry.resetTime
    };
}

/**
 * Obtiene la IP del cliente desde los headers de la request
 */
export function getClientIp(request: Request): string {
    // Intentar obtener IP desde headers comunes de proxies
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback genérico
    return 'unknown';
}
