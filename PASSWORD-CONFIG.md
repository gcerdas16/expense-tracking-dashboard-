# 🔐 CONFIGURACIÓN DE CONTRASEÑAS

## 📍 Estado Actual

### Desarrollo Local (tu computadora)
- **Contraseña:** `dashboard123`
- **Ubicación:** Hardcodeada en el código como fallback
- **Seguro para GitHub:** ✅ Sí, es solo para desarrollo

### Producción (Railway)
- **Contraseña:** Configuras tú en Railway
- **Ubicación:** Variable de entorno `PASSWORD_HASH`
- **Seguro:** ✅ Sí, no se sube a GitHub

---

## 🚀 Cómo funciona

El código usa esta lógica:

```javascript
// Si existe PASSWORD_HASH en variables de entorno → la usa
// Si NO existe → usa el hash de desarrollo (dashboard123)
const PASSWORD_HASH = process.env.PASSWORD_HASH || DEV_PASSWORD_HASH;
```

**Resultado:**
- ✅ En local: funciona con `dashboard123` automáticamente
- ✅ En Railway: usas la contraseña que configures
- ✅ GitHub público: solo ve el hash de desarrollo, no tu contraseña real

---

## 🔧 Para cambiar la contraseña de desarrollo

1. Edita `generar-hash-correcto.js`:
```javascript
const password = 'TuNuevaPassword';
```

2. Ejecuta:
```bash
node generar-hash-correcto.js
```

3. Copia el hash y reemplázalo en `src/app/api/auth/login/route.ts`:
```javascript
const DEV_PASSWORD_HASH = 'tu_nuevo_hash_aqui';
```

---

## ☁️ Para Railway (Producción)

1. Ve a tu proyecto en Railway → Variables
2. Agrega esta variable:
```
PASSWORD_HASH=tu_hash_de_produccion_aqui
```

3. Railway usará esa contraseña en lugar de `dashboard123`

---

## ✅ Checklist de Seguridad

- [x] Contraseña de desarrollo funciona localmente
- [x] Hash de desarrollo está en el código (seguro para GitHub)
- [ ] Cuando despliegues, configura PASSWORD_HASH en Railway
- [ ] Usa una contraseña DIFERENTE y más fuerte para producción

---

## 🎯 Resumen Simple

- **Local:** `dashboard123` - funciona automáticamente
- **GitHub:** Solo se ve el hash (seguro)  
- **Railway:** Configuras tu propia contraseña fuerte

**Todo está listo para usar y para subir a GitHub de forma segura.**
