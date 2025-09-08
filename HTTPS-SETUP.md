# Configuración HTTPS para Desarrollo Local

## 🔒 Certificados SSL Instalados

Se han configurado certificados SSL locales confiables para:
- `https://192.168.2.202:8000` (Laravel)
- `https://192.168.2.202:5173` (Vite HMR)
- `https://localhost:8000`
- `https://127.0.0.1:8000`

## 🚀 Inicio Rápido

### Opción 1: Script Automático
```bash
# Ejecutar el script de inicio
.\start-dev-https.bat
```

### Opción 2: Manual
```bash
# Terminal 1: Iniciar Laravel
php artisan serve --host=192.168.2.202 --port=8000

# Terminal 2: Iniciar Vite con HTTPS
npm run dev
```

## 🌐 URLs de Acceso

- **Aplicación Principal**: https://192.168.2.202:8000
- **Vite Dev Server**: https://192.168.2.202:5173
- **Alternativa Local**: https://localhost:8000

## ✅ Beneficios de HTTPS

1. **Descargas Seguras**: Sin avisos de "descarga no segura"
2. **Hot Module Replacement**: Funciona correctamente con WSS
3. **Service Workers**: Compatibles con HTTPS
4. **APIs Modernas**: Acceso completo a APIs del navegador
5. **Producción Similar**: Entorno más cercano a producción

## 🔧 Configuración Técnica

### Certificados
- **Ubicación**: `./certificates/`
- **Validez**: Hasta Diciembre 2027
- **Tipo**: Certificados autofirmados confiables

### Vite
- **Puerto**: 5173 (HTTPS)
- **HMR**: WebSocket Seguro (WSS)
- **CORS**: Configurado para múltiples orígenes

### Laravel
- **Puerto**: 8000 (HTTPS)
- **CSP**: Optimizado para desarrollo HTTPS
- **Headers**: Configuración de seguridad completa

## 🛠️ Solución de Problemas

### Error: "Certificado no confiable"
```bash
# Reinstalar CA root
.\mkcert.exe -install
```

### Error: "Puerto en uso"
```bash
# Verificar procesos
netstat -ano | findstr :8000
netstat -ano | findstr :5173
```

### Error: "Archivo no encontrado"
```bash
# Verificar certificados
dir certificates\
```

## 📝 Notas Importantes

- Los certificados son **solo para desarrollo local**
- **No usar en producción** estos certificados
- Los archivos SSL están en `.gitignore`
- Cada desarrollador debe generar sus propios certificados

## 🔄 Regenerar Certificados

Si necesitas regenerar los certificados:

```bash
# Limpiar certificados existentes
rmdir /s certificates

# Regenerar
.\mkcert.exe 192.168.2.202 localhost 127.0.0.1 ::1
mkdir certificates
move *.pem certificates\
```