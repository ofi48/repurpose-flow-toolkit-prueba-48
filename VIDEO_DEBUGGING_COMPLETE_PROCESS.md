# Video Repurposer - Proceso Completo de Debugging

## Arquitectura del Sistema y Responsabilidades

### 🎯 LOVABLE (Frontend React + Vite)
**Responsabilidad**: Interface de usuario, gestión de archivos locales, comunicación con APIs
- **Tecnologías**: React 18, TypeScript, Tailwind CSS, Vite
- **Funcionalidad**: Subida de archivos, configuración de parámetros, cola de procesamiento, descarga de resultados

### 🗄️ SUPABASE (Backend as a Service)
**Responsabilidad**: Autenticación, almacenamiento de archivos, edge functions como proxy
- **Plan**: Free Tier (500MB storage total, 50MB max file size)
- **Componentes**: Storage bucket `videos`, Edge Functions, Authentication

### 🚂 RAILWAY (Servidor de Procesamiento)
**Responsabilidad**: Procesamiento real de videos con FFmpeg
- **Endpoint**: `https://video-server-production-d7af.up.railway.app`
- **Tecnología**: Node.js + FFmpeg para manipulación de video

## 🔍 FLUJO COMPLETO DE DEBUGGING POR ETAPAS

### ETAPA 1: SELECCIÓN Y VALIDACIÓN DE ARCHIVOS
**Ubicación**: `src/components/video/MultiFileUpload.tsx`

#### Variables Clave de Debugging:
```typescript
// Estado del componente
const [isDragging, setIsDragging] = useState(false);
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

// Validación de archivos
const maxSize = 100 * 1024 * 1024; // 100MB (EXCEDE LÍMITE SUPABASE FREE)
const acceptedFileTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
```

#### Funciones de Debugging:
- `validateFile(file: File)`: Valida tipo y tamaño
- `processFiles(files: FileList | File[])`: Procesa lista de archivos
- `handleFileChange(e: React.ChangeEvent<HTMLInputElement>)`: Handler del input

#### Puntos de Debug:
```javascript
console.log('File validation:', {
  fileName: file.name,
  fileSize: file.size,
  fileType: file.type,
  isValid: file.size <= maxSize && acceptedFileTypes.includes(file.type)
});
```

### ETAPA 2: CONFIGURACIÓN DE PARÁMETROS DE PROCESAMIENTO
**Ubicación**: `src/pages/VideoRepurposer.tsx`, `src/types/preset.ts`

#### Variables Clave:
```typescript
// Configuración por defecto
const defaultSettings: VideoPresetSettings = {
  videoBitrate: { min: 800, max: 2000, enabled: true },
  audioBitrate: { min: 128, max: 320, enabled: true },
  saturation: { min: 0.8, max: 1.3, enabled: true },
  // ... más de 20 parámetros configurables
};

const [numCopies, setNumCopies] = useState(3);
```

#### Funciones de Debugging:
- `handleStartProcess()`: Inicia el procesamiento
- `updateWatermarkParam()`: Actualiza configuración de watermark
- `generateProcessingParameters()`: Genera parámetros aleatorios

### ETAPA 3: COLA DE PROCESAMIENTO
**Ubicación**: `src/hooks/useVideoQueue.ts`

#### Variables de Estado:
```typescript
interface QueueItem {
  id: string;                    // UUID único del item
  file: File;                   // Archivo de video original
  fileName: string;             // Nombre del archivo
  fileSize: number;             // Tamaño en bytes
  status: 'waiting' | 'processing' | 'completed' | 'error';
  progress: number;             // Progreso 0-100
  results?: ProcessedVideo[];   // Videos procesados
  error?: string;              // Mensaje de error
  settings?: VideoPresetSettings; // Configuración aplicada
  numCopies?: number;          // Número de copias a generar
}

const [queue, setQueue] = useState<QueueItem[]>([]);
const [isProcessing, setIsProcessing] = useState(false);
const [currentItem, setCurrentItem] = useState<string | null>(null);
```

#### Funciones Críticas:
- `addVideosToQueue()`: Añade videos a la cola
- `processQueue()`: Procesa la cola secuencialmente
- `processVideo()`: Procesa un video individual
- `updateItemStatus()`: Actualiza estado del item

### ETAPA 4: COMUNICACIÓN CON RAILWAY VÍA SUPABASE
**Ubicación**: `supabase/functions/process-video/index.ts`

#### Variables de Debugging Supabase Edge Function:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Endpoint de Railway
const RAILWAY_ENDPOINT = 'https://video-server-production-d7af.up.railway.app';
```

#### Funciones Edge Function:
- `handleVideoProcessing(req: Request)`: Handler principal
- Validación de API key
- Forwarding a Railway
- Manejo de respuestas y errores

#### Debugging Edge Function:
```javascript
console.log('Edge Function - Request received:', {
  method: req.method,
  hasApiKey: !!req.headers.get('apikey'),
  contentType: req.headers.get('content-type')
});

console.log('Railway response:', {
  status: railwayResponse.status,
  contentType: railwayResponse.headers.get('content-type'),
  responseSize: JSON.stringify(responseData).length
});
```

### ETAPA 5: PROCESAMIENTO EN RAILWAY
**Endpoint**: `POST /process-video`

#### Datos Enviados a Railway:
```typescript
const formData = new FormData();
formData.append('video', item.file);                    // Archivo de video
formData.append('settings', JSON.stringify(settings)); // Configuración JSON
formData.append('numCopies', numCopies.toString());    // Número de copias
```

#### Respuesta Esperada de Railway:
```typescript
interface RailwayResponse {
  success: boolean;
  results: Array<{
    name: string;           // Nombre del archivo procesado
    url: string;           // URL de descarga
    processingDetails?: {   // Detalles del procesamiento
      filters: string[];
      parameters: object;
      duration: number;
    };
  }>;
  error?: string;
}
```

### ETAPA 6: ACTUALIZACIÓN DE PROGRESO Y ESTADO
**Ubicación**: `useVideoQueue.processVideo()`

#### Simulación de Progreso:
```typescript
// Progreso simulado mientras se procesa
for (let progress = 0; progress <= 80; progress += 20) {
  updateItemStatus(item.id, { progress });
  await new Promise(resolve => setTimeout(resolve, 200));
}
```

#### Actualización Final:
```typescript
updateItemStatus(item.id, { 
  status: 'completed', 
  progress: 100, 
  results: processedVideos 
});
```

### ETAPA 7: VISUALIZACIÓN DE RESULTADOS
**Ubicación**: `src/components/video/ResultsTab.tsx`, `src/components/video/VideoCard.tsx`

#### Variables de Resultados:
```typescript
interface ProcessedVideo {
  name: string;              // Nombre del archivo procesado
  url: string;              // URL completa de descarga
  processingDetails?: any;   // Detalles del procesamiento aplicado
}

const results: ProcessedVideo[] = []; // Array de videos procesados
```

#### Funciones de Visualización:
- `handlePreview()`: Muestra preview del video
- `handleDownload()`: Descarga individual
- `handleDownloadAll()`: Descarga masiva

### ETAPA 8: DESCARGA DE ARCHIVOS
**Ubicación**: `src/pages/VideoRepurposer.tsx`

#### Funciones de Descarga:
```typescript
const handleDownload = async (fileName: string, fileUrl: string) => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
  }
};

const handleDownloadAll = async () => {
  for (const result of results) {
    await handleDownload(result.name, result.url);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
```

## 🚨 PUNTOS CRÍTICOS DE DEBUGGING

### 1. Validación de Tamaño de Archivo
```javascript
// PROBLEMA: Límite frontend (100MB) > Límite Supabase Free (50MB)
const maxSize = 100 * 1024 * 1024; // Debería ser 50MB para Free tier
```

### 2. Gestión de Errores en Edge Function
```javascript
// Debugging respuesta de Railway
if (!contentType || !contentType.includes('application/json')) {
  console.error('Railway returned non-JSON:', {
    contentType,
    status: response.status,
    responsePreview: textResponse.substring(0, 200)
  });
}
```

### 3. Monitoreo de Cola de Procesamiento
```javascript
// Estado de la cola en tiempo real
console.log('Queue status:', {
  totalItems: queue.length,
  waitingItems: queue.filter(item => item.status === 'waiting').length,
  processingItems: queue.filter(item => item.status === 'processing').length,
  completedItems: queue.filter(item => item.status === 'completed').length,
  errorItems: queue.filter(item => item.status === 'error').length,
  currentProcessing: currentItem
});
```

### 4. Validación de URLs de Resultados
```javascript
// Asegurar URLs completas
const processedVideos = responseData.results.map(result => ({
  name: result.name,
  url: result.url.startsWith('http') 
    ? result.url 
    : `https://video-server-production-d7af.up.railway.app${result.url}`,
  processingDetails: result.processingDetails
}));
```

## 🛠️ HERRAMIENTAS DE DEBUGGING DISPONIBLES

### En Lovable:
- **Console Logs**: `lov-read-console-logs` para errores del frontend
- **Network Requests**: `lov-read-network-requests` para requests fallidos
- **Dev Tools**: Inspección de estado React, network tab

### En Supabase:
- **Edge Function Logs**: Monitoreo de requests y errores
- **Storage Metrics**: Uso de espacio y archivos
- **Auth Logs**: Logs de autenticación si está habilitada

### En Railway:
- **Server Logs**: Logs del procesamiento FFmpeg
- **Deployment Logs**: Errores de deployment
- **Metrics**: CPU, memoria, requests

## 🎯 CHECKLIST DE DEBUGGING SISTEMÁTICO

### ✅ Verificaciones Iniciales:
1. **Tamaño de archivo** ≤ 50MB (límite Supabase Free)
2. **Tipo de archivo** en `acceptedFileTypes`
3. **Estado de la cola** no está procesando ya
4. **Configuración de parámetros** válida

### ✅ Durante el Procesamiento:
1. **Edge Function** recibe request correctamente
2. **Railway endpoint** responde con JSON válido
3. **Progreso** se actualiza correctamente
4. **Errores** se manejan y muestran al usuario

### ✅ Resultados y Descarga:
1. **URLs de resultados** son accesibles
2. **Archivos procesados** se descargan correctamente
3. **Detalles de procesamiento** están disponibles
4. **Estado final** es 'completed'

## 💡 OPTIMIZACIONES RECOMENDADAS

### Límites y Validación:
- Reducir `maxSize` a 50MB para alinear con Supabase Free
- Implementar validación de duración de video
- Añadir verificación de formato de video específico

### Monitoreo y Logs:
- Implementar logging estructurado en cada etapa
- Añadir métricas de tiempo de procesamiento
- Crear dashboard de estado del sistema

### Manejo de Errores:
- Implementar retry automático para fallos de red
- Añadir timeout para requests largos
- Crear mensajes de error más específicos por tipo de fallo

Este prompt de debugging cubre todo el ecosistema de procesamiento de video, desde la interfaz de usuario hasta el servidor de procesamiento, pasando por todas las capas intermedias.