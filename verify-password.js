const bcrypt = require('bcryptjs');

// Hash actual en tu .env.local
const hashEnArchivo = '$2b$10$hmZoHFWQ.L0pPVi3qy/cP.8eiMlc3CxdkdcTlvThmEunS6/y6SpZ2';

// Contraseña del script
const passwordDelScript = 'VMpro2580@';

console.log('🔍 Verificando si el hash corresponde a la contraseña del script...\n');

bcrypt.compare(passwordDelScript, hashEnArchivo).then(isMatch => {
    if (isMatch) {
        console.log('✅ El hash SÍ corresponde a la contraseña: VMpro2580@');
        console.log('\n📝 Usa esta contraseña para hacer login.');
    } else {
        console.log('❌ El hash NO corresponde a la contraseña del script.');
        console.log('\n🔄 Necesitas regenerar el hash. Opciones:');
        console.log('   1. Ejecuta: node generate-password-hash.js');
        console.log('   2. O cambia la contraseña en el script y regénera');
    }
});
