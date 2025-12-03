/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require('bcryptjs');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🔐 CAMBIAR CONTRASEÑA DEL DASHBOARD\n');
console.log('='.repeat(60));

rl.question('\n¿Cuál será tu nueva contraseña? ', (password) => {
    if (!password || password.length < 6) {
        console.log('\n❌ La contraseña debe tener al menos 6 caracteres\n');
        rl.close();
        return;
    }

    console.log('\n⏳ Generando hash...\n');

    bcrypt.hash(password, 10).then(hash => {
        console.log('✅ Hash generado:\n');
        console.log(hash);
        console.log('\n' + '='.repeat(60));
        
        // Leer el archivo de login
        const loginPath = './src/app/api/auth/login/route.ts';
        let content = fs.readFileSync(loginPath, 'utf8');
        
        // Reemplazar el hash
        const hashRegex = /const PASSWORD_HASH = '\$2[ab]\$\d{2}\$[A-Za-z0-9./]{53}';/;
        const newLine = `const PASSWORD_HASH = '${hash}';`;
        
        if (hashRegex.test(content)) {
            content = content.replace(hashRegex, newLine);
            fs.writeFileSync(loginPath, content);
            
            console.log('\n✅ Contraseña actualizada exitosamente en el código\n');
            console.log('📝 Tu nueva contraseña es: ' + password);
            console.log('\n' + '='.repeat(60));
            console.log('\n⚠️  IMPORTANTE:');
            console.log('   1. Reinicia el servidor (Ctrl+C y luego npm run dev)');
            console.log('   2. Guarda esta contraseña en un lugar seguro');
            console.log('   3. Si subes a Railway, actualiza el código allá también\n');
        } else {
            console.log('\n⚠️  No se pudo actualizar automáticamente.');
            console.log('   Copia este hash manualmente:');
            console.log('\n   ' + newLine + '\n');
            console.log('   Y reemplázalo en: src/app/api/auth/login/route.ts\n');
        }
        
        rl.close();
    });
});
