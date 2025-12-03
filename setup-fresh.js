/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');

const password = 'admin2024';

console.log('\n🔧 CONFIGURACIÓN AUTOMÁTICA DEL DASHBOARD\n');
console.log('='.repeat(70));

bcrypt.hash(password, 10).then(hash => {
    const sessionSecret = crypto.randomBytes(32).toString('base64');
    
    // Leer el .env.local actual
    let envContent = '';
    try {
        envContent = fs.readFileSync('.env.local', 'utf8');
    } catch (err) {
        console.log('⚠️  No se encontró .env.local, creando uno nuevo...');
    }
    
    // Actualizar o agregar las variables
    const lines = envContent.split('\n');
    let passwordHashFound = false;
    let sessionSecretFound = false;
    
    const newLines = lines.map(line => {
        if (line.startsWith('PASSWORD_HASH=')) {
            passwordHashFound = true;
            return `PASSWORD_HASH=${hash}`;
        }
        if (line.startsWith('SESSION_SECRET=')) {
            sessionSecretFound = true;
            return `SESSION_SECRET=${sessionSecret}`;
        }
        return line;
    });
    
    // Si no existían, agregarlas
    if (!passwordHashFound) {
        newLines.push(`PASSWORD_HASH=${hash}`);
    }
    if (!sessionSecretFound) {
        newLines.push(`SESSION_SECRET=${sessionSecret}`);
    }
    
    // Guardar el archivo
    fs.writeFileSync('.env.local', newLines.join('\n'));
    
    console.log('\n✅ Archivo .env.local actualizado correctamente');
    console.log('\n' + '='.repeat(70));
    console.log('\n🔑 TU NUEVA CONTRASEÑA ES: ' + password);
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 PASOS FINALES:\n');
    console.log('1. ❌ DETÉN el servidor si está corriendo (Ctrl+C)');
    console.log('2. ▶️  Inicia el servidor: npm run dev');
    console.log('3. 🌐 Abre: http://localhost:3000');
    console.log('4. 🔐 Usa la contraseña: ' + password);
    console.log('\n' + '='.repeat(70));
    console.log('\n✨ ¡Listo! Ahora debería funcionar.\n');
});
