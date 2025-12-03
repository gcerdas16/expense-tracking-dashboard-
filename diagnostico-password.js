/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require('bcryptjs');

// Hash actual en .env.local
const hashActual = '$2b$10$S0v9bNozTo5qVTLniiqwBe9VQ.XHqfCrtHwhDzvS8CA2Okz4zLg/2';

// Contraseñas comunes para probar
const passwordsParaProbar = [
    'VMpro2580@',
    'MiPassword123!',
    'admin',
    'password',
    '123456'
];

console.log('🔍 DIAGNÓSTICO DE CONTRASEÑA\n');
console.log('='.repeat(60));
console.log('\nHash actual en .env.local:');
console.log(hashActual);
console.log('\n' + '='.repeat(60));
console.log('\nProbando contraseñas comunes...\n');

async function probarPasswords() {
    for (const pwd of passwordsParaProbar) {
        const match = await bcrypt.compare(pwd, hashActual);
        if (match) {
            console.log(`✅ ¡ENCONTRADA! La contraseña es: "${pwd}"`);
            console.log('\n' + '='.repeat(60));
            console.log('\n📝 USA ESTA CONTRASEÑA PARA HACER LOGIN\n');
            return;
        } else {
            console.log(`❌ No es: "${pwd}"`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n❌ Ninguna contraseña común funcionó.');
    console.log('\n🔄 SOLUCIÓN: Genera un nuevo hash con una contraseña que conozcas:');
    console.log('\n1. Edita el archivo: generate-new-password.js');
    console.log('2. Cambia la línea: const miNuevaPassword = "TuPasswordAqui";');
    console.log('3. Ejecuta: node generate-new-password.js');
    console.log('4. Copia el PASSWORD_HASH y SESSION_SECRET al .env.local');
    console.log('5. Reinicia el servidor\n');
}

probarPasswords();
