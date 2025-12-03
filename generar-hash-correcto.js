const bcrypt = require('bcryptjs');

const password = 'dashboard123';

bcrypt.hash(password, 10).then(hash => {
    console.log('\n✅ Hash generado para password:', password);
    console.log('\nHash:', hash);
    console.log('\n');
    
    // Verificar que funciona
    bcrypt.compare(password, hash).then(result => {
        console.log('Verificación:', result ? '✅ CORRECTO' : '❌ ERROR');
    });
});
