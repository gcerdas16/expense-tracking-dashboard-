/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Contraseña simple y fácil de recordar
const password = 'dashboard123';

console.log('\n🔐 GENERANDO NUEVAS CREDENCIALES\n');
console.log('='.repeat(60));
console.log(`\nContraseña que usarás: ${password}\n`);

bcrypt.hash(password, 10).then(hash => {
    const sessionSecret = crypto.randomBytes(32).toString('base64');
    
    console.log('✅ CREDENCIALES GENERADAS:\n');
    console.log('PASSWORD_HASH=' + hash);
    console.log('SESSION_SECRET=' + sessionSecret);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 PASOS A SEGUIR:\n');
    console.log('1. Copia las dos líneas de arriba (PASSWORD_HASH y SESSION_SECRET)');
    console.log('2. Abre tu archivo: .env.local');
    console.log('3. REEMPLAZA las líneas PASSWORD_HASH y SESSION_SECRET existentes');
    console.log('4. Guarda el archivo .env.local');
    console.log('5. REINICIA el servidor (Ctrl+C y luego npm run dev)');
    console.log(`6. Usa la contraseña: ${password}`);
    console.log('\n' + '='.repeat(60) + '\n');
});
