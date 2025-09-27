# Servidor de Procesamiento de Video para Railway

## Archivos para subir a Railway

1. **server.js** - Copia el contenido de `railway-server-code.js`
2. **package.json** - Copia el contenido de `railway-package.json`
3. **Dockerfile** - Copia el contenido de `railway-dockerfile`

## Instrucciones de instalación en Railway

### Paso 1: Crear nuevo proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo" o "Empty Project"

### Paso 2: Configurar el proyecto
1. Sube los archivos:
   - Renombra `railway-server-code.js` a `server.js`
   - Sube `package.json`
   - Sube `Dockerfile` (sin extensión)

### Paso 3: Configurar variables de entorno (opcional)
- `PORT`: 3000 (Railway lo configura automáticamente)
- `NODE_ENV`: production

### Paso 4: Deploy
Railway detectará automáticamente el Dockerfile y comenzará el deploy.

## Características del servidor

### Endpoints disponibles:
- `POST /process-video` - Procesa videos con efectos
- `GET /download/:filename` - Descarga videos procesados
- `POST /compare-media` - Compara archivos multimedia
- `GET /health` - Verificación de estado

### Efectos soportados:
- **Calidad de video**: Bitrate y frame rate
- **Ajustes de color**: Saturación, contraste, brillo
- **Transformaciones**: Velocidad, volteo horizontal
- **Audio**: Volumen
- **Recorte**: Inicio y fin del video

### Características técnicas:
- Procesamiento con FFmpeg
- Soporte para archivos hasta 500MB
- Formatos soportados: MP4, AVI, MOV, WMV, WEBM
- Aplicación correcta de todos los filtros
- Limpieza automática de archivos temporales
- Logs detallados para debugging

## Diferencias principales con el servidor anterior:

1. **Aplicación correcta de efectos**: Cada parámetro se aplica individualmente con validación
2. **Filtros FFmpeg adecuados**: Uso de filtros eq, setpts, atempo, volume, hflip
3. **Validación de parámetros**: Verificación de que los efectos están habilitados antes de aplicarlos
4. **Mejor manejo de errores**: Logs detallados y limpieza de archivos
5. **Optimización de calidad**: Configuración de codec H.264 con preset medium y CRF 23

El servidor ahora garantiza que todos los efectos seleccionados en el frontend se apliquen correctamente al video procesado.