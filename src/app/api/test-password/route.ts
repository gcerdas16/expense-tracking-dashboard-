import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
    const passwordHash = process.env.PASSWORD_HASH;
    
    if (!passwordHash) {
        return NextResponse.json({
            error: 'PASSWORD_HASH no está configurado en .env.local'
        });
    }

    // Lista de contraseñas para probar
    const passwordsToTest = [
        'VMpro2580@',
        'mipassword123',
        'MiPassword123!',
        'admin',
        'password'
    ];

    const results = [];

    for (const pwd of passwordsToTest) {
        const isValid = await bcrypt.compare(pwd, passwordHash);
        results.push({
            password: pwd,
            matches: isValid
        });
    }

    return NextResponse.json({
        hashFromEnv: passwordHash.substring(0, 20) + '...',
        testResults: results,
        matchFound: results.find(r => r.matches)?.password || 'Ninguna coincide'
    });
}
