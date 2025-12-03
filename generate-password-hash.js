/* eslint-disable @typescript-eslint/no-require-imports */
// ================================================================================================
// SCRIPT PARA GENERAR HASH DE CONTRASEÑA
// ================================================================================================
// Ejecuta: node generate-password-hash.js
// ================================================================================================

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

console.log('\n🔐 GENERADOR DE CREDENCIALES DE SEGURIDAD\n');
console.log('='.repeat(60));

// Pregunta por la contraseña (puedes cambiarla aquí directamente)
const password = 'VMpro2580@'; // 👈 CAMBIA ESTO POR TU CONTRASEÑA

console.log('\n📝 Generando hash de contraseña...\n');

bcrypt.hash(password, 10).then(hash => {
    console.log('✅ Hash generado exitosamente:');
    console.log('\nPASSWORD_HASH=' + hash);

    console.log('\n' + '-'.repeat(60));
    console.log('\n📝 Generando SESSION_SECRET...\n');

    const sessionSecret = crypto.randomBytes(32).toString('base64');
    console.log('✅ SESSION_SECRET generado exitosamente:');
    console.log('\nSESSION_SECRET=' + sessionSecret);

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 COPIA ESTAS LÍNEAS A TU ARCHIVO .env.local:\n');
    console.log('PASSWORD_HASH=' + hash);
    console.log('SESSION_SECRET=' + sessionSecret);
    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales de forma segura');
    console.log('⚠️  NO las compartas ni las subas a GitHub\n');
});