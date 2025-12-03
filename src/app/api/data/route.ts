import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
    // Verificar autenticación
    const authenticated = await isAuthenticated();

    if (!authenticated) {
        return NextResponse.json(
            { error: 'No autorizado' },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const urls = {
        expenses: process.env.EXPENSES_CSV_URL,
        incomes: process.env.INCOMES_CSV_URL
    };

    const url = type === 'incomes' ? urls.incomes : urls.expenses;

    if (!url) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    try {
        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                // Agregar cache control para evitar datos muy antiguos
                next: { revalidate: 60 } // Revalidar cada 60 segundos
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.status}`);
            }

            const data = await response.text();

            return new NextResponse(data, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Cache-Control': 'private, max-age=60', // Cache privado por 60 segundos
                    'X-Content-Type-Options': 'nosniff', // Prevenir MIME sniffing
                }
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                return NextResponse.json(
                    { error: 'Tiempo de espera agotado al obtener los datos' },
                    { status: 504 }
                );
            }
            throw fetchError;
        }
    } catch (error) {
        // No exponer detalles del error en producción
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching CSV:', error);
        }
        return NextResponse.json(
            { error: 'Error al obtener los datos' },
            { status: 500 }
        );
    }
}