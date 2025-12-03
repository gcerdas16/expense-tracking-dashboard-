# 🔒 Guía de Seguridad para GitHub Público

## ⚠️ IMPORTANTE: Archivos que NUNCA debes subir

El archivo `.gitignore` ya está configurado para prevenir esto, pero asegúrate de NO subir:

- ❌ `.env.local` - Contiene tus secretos reales
- ❌ `.env` - Puede contener secretos
- ❌ Cualquier archivo con contraseñas o tokens

## ✅ Archivo seguro para subir

- ✅ `.env.example` - Template sin secretos reales

---

## 🔐 Configuración Local (Tu computadora)

### 1. Archivo `.env.local` (NO se sube a GitHub)

Tu archivo `.env.local` debe contener:

```bash
EXPENSES_CSV_URL=tu_url_real_aqui
INCOMES_CSV_URL=tu_url_real_aqui
PASSWORD_HASH=tu_hash_real_aqui
SESSION_SECRET=tu_secreto_real_aqui
```

### 2. Generar tu propia contraseña

```bash
# Edita el archivo generar-hash-correcto.js primero
# Cambia la línea: const password = 'TuPasswordAqui';
node generar-hash-correcto.js

# Copia el hash que aparezca y pégalo en .env.local
```

### 3. Generar SESSION_SECRET

```bash
node -p "require('crypto').randomBytes(32).toString('base64')"

# Copia el resultado y pégalo en .env.local
```

---

## ☁️ Configuración en Railway (Producción)

### Paso 1: Ve a tu proyecto en Railway

1. Abre tu proyecto en Railway
2. Ve a la pestaña **Variables**

### Paso 2: Agrega estas variables de entorno

```
EXPENSES_CSV_URL=tu_url_de_google_sheets
INCOMES_CSV_URL=tu_url_de_google_sheets
PASSWORD_HASH=tu_hash_de_bcrypt
SESSION_SECRET=tu_secreto_aleatorio_minimo_32_chars
NODE_ENV=production
```

### Paso 3: Genera credenciales para producción

**IMPORTANTE:** Usa credenciales DIFERENTES para producción.

```bash
# 1. Genera un nuevo hash con una contraseña FUERTE
node generar-hash-correcto.js

# 2. Genera un nuevo SESSION_SECRET
node -p "require('crypto').randomBytes(32).toString('base64')"

# 3. Pega estos valores en las variables de Railway
```

---

## 🚀 Deploy a Railway

### Opción 1: Desde GitHub

1. Sube tu código a GitHub (el `.gitignore` protegerá tus secretos)
2. Conecta Railway a tu repositorio
3. Railway detectará automáticamente que es un proyecto Next.js
4. Configura las variables de entorno en Railway
5. Deploy automático ✅

### Opción 2: Railway CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Deploy
railway up
```

---

## ✅ Checklist antes de hacer commit

Antes de hacer `git push`, verifica:

- [ ] El archivo `.env.local` NO está en git (`git status` no debería mostrarlo)
- [ ] El archivo `.env.example` SÍ está incluido (sin secretos reales)
- [ ] El `.gitignore` incluye `.env*` y `.env.local`
- [ ] No hay contraseñas hardcodeadas en el código
- [ ] Las variables de entorno están configuradas en Railway

---

## 🔍 Verificar que .env.local está ignorado

```bash
# Este comando NO debería mostrar .env.local
git status

# Si aparece .env.local, ejecuta:
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"
```

---

## 🛡️ Buenas Prácticas

1. **Nunca** compartas tu `.env.local`
2. **Nunca** subas capturas de pantalla con variables de entorno
3. **Usa contraseñas diferentes** para desarrollo y producción
4. **Rota los secretos** periódicamente (cada 3-6 meses)
5. **Usa 2FA** en GitHub y Railway

---

## 🆘 ¿Accidentalmente subiste secretos?

Si subiste `.env.local` o secretos por error:

### 1. Elimínalo del historial

```bash
# Eliminar del cache de git
git rm --cached .env.local

# Commit
git commit -m "Remove sensitive file"
git push
```

### 2. Cambia TODAS las credenciales

```bash
# Genera nuevos secretos
node generar-hash-correcto.js
node -p "require('crypto').randomBytes(32).toString('base64')"

# Actualiza .env.local
# Actualiza variables en Railway
```

### 3. Considera limpiar el historial de Git

Si el secreto está en commits antiguos:
- Usa `git filter-branch` o BFG Repo-Cleaner
- O crea un nuevo repositorio

---

## 📚 Recursos Adicionales

- [Railway Docs - Environment Variables](https://docs.railway.app/develop/variables)
- [Next.js Docs - Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [GitHub - Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
