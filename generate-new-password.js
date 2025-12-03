/* eslint-disable @typescript-eslint/no-require-imports */
// ================================================================================================
// SCRIPT PARA GENERAR HASH DE CONTRASEÑA
// ================================================================================================
// Ejecuta: node generate-new-password.js
// ================================================================================================

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

console.log('\n🔐 GENERADOR DE CREDENCIALES\n');
console.log('='.repeat(60));

// 👇 CAMBIA ESTA CONTRASEÑA POR LA QUE QUIERAS USAR
const miNuevaPassword = 'VMpro2580'; // ⬅️ EDITA AQUÍ

console.log(`\n📝 Generando hash para la contraseña: "${miNuevaPassword}"\n`);

bcrypt.hash(miNuevaPassword, 10).then(hash => {
    const sessionSecret = crypto.randomBytes(32).toString('base64');

    console.log('✅ CREDENCIALES GENERADAS:\n');
    console.log('PASSWORD_HASH=' + hash);
    console.log('SESSION_SECRET=' + sessionSecret);

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 INSTRUCCIONES:\n');
    console.log('1. Copia las dos líneas de arriba');
    console.log('2. Pégalas en tu archivo .env.local (reemplaza las existentes)');
    console.log(`3. Usa la contraseña: "${miNuevaPassword}" para hacer login`);
    console.log('4. Reinicia el servidor: npm run dev');
    console.log('\n' + '='.repeat(60) + '\n');
});
