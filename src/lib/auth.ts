import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
    isAuthenticated: boolean;
    userId?: string;
}

// Leer SESSION_SECRET desde variables de entorno
const SESSION_SECRET = process.env.SESSION_SECRET;

// Verificar que existe la variable
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('❌ CRITICAL: SESSION_SECRET must be set and be at least 32 characters long in production');
    }
    console.warn('⚠️  WARNING: SESSION_SECRET not set or too short. Using development fallback.');
}

// Configuración de la sesión
export const sessionOptions = {
    password: SESSION_SECRET || 'development-secret-minimum-32-chars-CHANGE-IN-PRODUCTION-12345',
    cookieName: 'expense_dashboard_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 7, // 7 días
    },
};

// Obtener la sesión actual
export async function getSession(): Promise<IronSession<SessionData>> {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// Verificar si el usuario está autenticado
export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session.isAuthenticated === true;
}

// Crear sesión de usuario
export async function createSession(): Promise<void> {
    const session = await getSession();
    session.isAuthenticated = true;
    session.userId = 'admin';
    await session.save();
}

// Destruir sesión
export async function destroySession(): Promise<void> {
    const session = await getSession();
    session.destroy();
}
