# 🔒 Documentación de Seguridad - Dashboard de Gastos

## Mejoras Implementadas

### ✅ 1. Eliminación de Fallback Inseguro
**Archivo:** `src/lib/auth.ts`
- ❌ **Antes:** Usaba un secreto hardcodeado si faltaba `SESSION_SECRET`
- ✅ **Ahora:** La aplicación falla inmediatamente si falta la variable
- **Impacto:** Previene el uso de secretos conocidos públicamente

### ✅ 2. Rate Limiting en Login
**Archivos:** 
- `src/lib/rate-limit.ts` (nuevo)
- `src/app/api/auth/login/route.ts`

**Configuración:**
- Máximo 5 intentos por IP cada 15 minutos
- Respuesta HTTP 429 con header `Retry-After`
- Limpieza automática de entradas expiradas

**Protege contra:**
- Ataques de fuerza bruta
- Intentos automatizados de login

### ✅ 3. Validación Real de Sesión en Middleware
**Archivo:** `src/middleware.ts`
- ❌ **Antes:** Solo verificaba que existiera la cookie
- ✅ **Ahora:** Valida el contenido y firma de la sesión con iron-session
- **Impacto:** Un atacante no puede crear cookies falsas

### ✅ 4. Cookies con SameSite
**Archivo:** `src/lib/auth.ts`
- Agregado `sameSite: 'lax'` a las cookies
- **Protege contra:** Algunos tipos de ataques CSRF

### ✅ 5. Headers de Seguridad HTTP
**Archivo:** `next.config.ts`

Headers implementados:
- `X-Frame-Options: SAMEORIGIN` - Previene clickjacking
- `X-Content-Type-Options: nosniff` - Previene MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Protección XSS del navegador
- `Strict-Transport-Security` - Fuerza HTTPS
- `Content-Security-Policy` - Controla qué recursos se pueden cargar
- `Referrer-Policy` - Controla información de referrer
- `Permissions-Policy` - Deshabilita APIs innecesarias

### ✅ 6. Timeouts en Fetch Externos
**Archivo:** `src/app/api/data/route.ts`
- Timeout de 10 segundos para peticiones a Google Sheets
- Manejo específico de timeout con código 504
- Previene que la app se cuelgue esperando respuestas

### ✅ 7. Mejor Manejo de Errores
**Archivos:** Todos los routes API
- Logs de error solo en desarrollo
- Mensajes genéricos en producción
- **Impacto:** No expone detalles internos a posibles atacantes

---

## 🎯 Nivel de Seguridad Alcanzado

### Vulnerabilidades Críticas Resueltas
- ✅ Secreto de sesión inseguro
- ✅ Sin rate limiting
- ✅ Validación débil de sesión
- ✅ Sin protección CSRF básica

### Vulnerabilidades Medias Resueltas
- ✅ Headers de seguridad ausentes
- ✅ Logs exponen información
- ✅ Sin timeouts en fetch
- ✅ Cookie sin SameSite

---

## 📋 Recomendaciones Adicionales

### Para Producción
1. **Rotar SESSION_SECRET regularmente**
   - Cambia el secreto cada 3-6 meses
   - Usa herramienta: `openssl rand -base64 32`

2. **Monitoreo y Alertas**
   - Implementa logging centralizado
   - Alertas para intentos de login fallidos masivos
   - Monitorea headers de seguridad con herramientas como SecurityHeaders.com

3. **Rate Limiting Mejorado**
   - Para producción con múltiples instancias, usa Redis
   - Considera rate limiting también en `/api/data`

4. **Auditorías Regulares**
   - Ejecuta `npm audit` regularmente
   - Mantén dependencias actualizadas
   - Considera herramientas como Snyk o Dependabot

5. **HTTPS Obligatorio**
   - Asegúrate de que tu hosting fuerce HTTPS
   - Verifica que el certificado SSL sea válido

### Para Desarrollo
1. **Variables de Entorno**
   - Nunca commitees `.env.local` a Git
   - Usa `.env.example` para documentar variables necesarias

2. **Testing de Seguridad**
   - Prueba el rate limiting manualmente
   - Verifica headers con herramientas de desarrollo del navegador
   - Intenta acceder a rutas protegidas sin sesión

---

## 🔍 Cómo Verificar las Mejoras

### 1. Rate Limiting
```bash
# Hacer 6 intentos de login fallidos rápidamente
# El 6to debería retornar error 429
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password":"wrong"}'
  echo "\nIntento $i"
  sleep 1
done
```

### 2. Headers de Seguridad
```bash
# Verificar headers en producción
curl -I https://tu-dominio.com
```

O usa: https://securityheaders.com

### 3. Validación de Sesión
1. Abre DevTools → Application → Cookies
2. Modifica manualmente el valor de `expense_dashboard_session`
3. Recarga la página - deberías ser redirigido a login

---

## ⚠️ Notas Importantes

- El rate limiting actual es **en memoria**, se reinicia al reiniciar el servidor
- Para múltiples instancias/servidores, implementa rate limiting con Redis
- CSP está configurado con `unsafe-inline` y `unsafe-eval` para compatibilidad con Next.js - ajusta según necesites
- Los secretos actuales en `.env.local` deben rotarse si este proyecto está en producción

---

## 📞 Siguiente Nivel de Seguridad

Si quieres llevar la seguridad al siguiente nivel, considera:
1. Autenticación de dos factores (2FA)
2. Logging y monitoreo avanzado (ej: Sentry)
3. WAF (Web Application Firewall)
4. Análisis estático de código (SAST)
5. Pruebas de penetración profesionales
