import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    // Rutas públicas que no requieren autenticación
    const publicPaths = [
        '/login', 
        '/api/auth/login', 
        '/api/test-password',
        '/api/gmail-webhook',
        '/api/sync-slack-replies',
        '/api/test-gmail-process',
        '/api/renew-gmail-watch',
        '/api/mark-all-read',
        '/api/test-write-sheet',
        '/api/debug-emails'
    ];
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // Si está en una ruta pública, permitir acceso
    if (isPublicPath) {
        return NextResponse.next();
    }

    // Verificar si existe la cookie de sesión
    const sessionCookie = request.cookies.get('expense_dashboard_session');

    // Si no hay cookie de sesión, redirigir a login
    if (!sessionCookie) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Validar el contenido de la sesión
    try {
        const response = NextResponse.next();
        const session = await getIronSession<SessionData>(
            request,
            response,
            sessionOptions
        );

        // Verificar que la sesión sea válida y esté autenticada
        if (!session.isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }

        return response;
    } catch (error) {
        // Si hay error al validar la sesión, redirigir a login
        console.error('Error validating session:', error);
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }
}

// Configurar qué rutas debe proteger el middleware
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};