# 🔐 Sistema de Autenticación Simplificado

## ✅ CONTRASEÑA ACTUAL

**Contraseña:** `dashboard123`

Esta contraseña está hardcodeada en el código para evitar problemas con variables de entorno.

---

## 🚀 Cómo iniciar

```bash
# 1. Limpiar cache
rm -rf .next

# 2. Iniciar servidor
npm run dev

# 3. Abrir navegador
http://localhost:3000

# 4. Usar contraseña
dashboard123
```

---

## 🔧 Cómo cambiar la contraseña

Si quieres cambiar la contraseña:

### Opción 1: Usar el script incluido

```bash
node cambiar-password.js
```

Sigue las instrucciones que aparezcan.

### Opción 2: Manual

1. Genera un nuevo hash:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TuNuevaPassword', 10).then(h => console.log(h));"
```

2. Copia el hash que aparezca

3. Abre el archivo: `src/app/api/auth/login/route.ts`

4. Reemplaza el valor de `PASSWORD_HASH` con tu nuevo hash

5. Reinicia el servidor

---

## 📝 Notas Importantes

- La contraseña ya NO depende del archivo `.env.local`
- El hash está directamente en el código para máxima compatibilidad
- Para producción en Railway, tendrás que actualizar el hash allá también

---

## 🔒 Seguridad

- El sistema usa bcrypt para hashear contraseñas
- Rate limiting: máximo 5 intentos cada 15 minutos
- Sesiones encriptadas con iron-session
- Headers de seguridad HTTP configurados

---

## ❓ Problemas Comunes

### "Contraseña incorrecta"
- Asegúrate de usar: `dashboard123` (todo minúscula)
- Si cambiaste el hash, verifica que sea correcto

### El servidor no inicia
```bash
rm -rf .next node_modules/.cache
npm install
npm run dev
```

### Cambios no se reflejan
```bash
# Ctrl+C para detener el servidor
rm -rf .next
npm run dev
```
