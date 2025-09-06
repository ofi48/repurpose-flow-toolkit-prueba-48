# Video Repurposer - Guía Completa de Implementación

## Prompt para Lovable: Recrear Video Repurposer Completo

### OBJETIVO PRINCIPAL
Crear un sistema completo de repurposing de video que genere múltiples variantes únicas de un video original aplicando efectos aleatorios, con integración completa a Supabase para almacenamiento y procesamiento.

---

## 1. ARQUITECTURA GENERAL DEL SISTEMA

### Stack Tecnológico Requerido
```typescript
// Dependencias principales
- React 18+ con TypeScript
- Tailwind CSS con sistema de tokens semánticos
- Supabase (Base de datos + Storage + Edge Functions)
- FFmpeg para procesamiento de video
- Lucide React para iconografía
- React Hook Form para formularios
- Shadcn/UI como sistema de componentes base
```

### Estructura de Archivos Requerida
```
src/
├── components/
│   └── video/
│       ├── MultiFileUpload.tsx
│       ├── VideoCard.tsx
│       ├── VideoPreview.tsx
│       ├── VideoProcessingPanel.tsx
│       ├── VideoQueue.tsx
│       ├── ProcessTab.tsx
│       ├── ResultsTab.tsx
│       ├── ParameterSection.tsx
│       └── PresetManager.tsx
├── hooks/
│   ├── useVideoQueue.ts
│   ├── useVideoProcessing.ts
│   └── usePresets.ts
├── types/
│   └── preset.ts
├── pages/
│   └── VideoRepurposer.tsx
└── utils/
    └── videoProcessing.ts
```

---

## 2. INTEGRACIÓN COMPLETA CON SUPABASE

### 2.1 Configuración de Supabase

**Storage Bucket Requerido:**
```sql
-- Crear bucket público para videos procesados
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- Políticas de almacenamiento
CREATE POLICY "Allow public access to videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Allow authenticated uploads" ON storage.objects  
FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);
```

**Edge Function de Procesamiento:**
```typescript
// supabase/functions/process-video/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const videoFile = formData.get('video') as File
    const settings = JSON.parse(formData.get('settings') as string)
    const numCopies = parseInt(formData.get('numCopies') as string)
    
    // Procesar video con Railway/FFmpeg server
    const railwayResponse = await fetch('https://video-server-production-d7af.up.railway.app/process-video', {
      method: 'POST',
      body: formData
    })
    
    const result = await railwayResponse.json()
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### 2.2 Cliente Supabase
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wowulglaoykdvfuqkpxd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 3. SISTEMA DE TIPOS Y VARIABLES

### 3.1 Interfaz Principal de Configuración
```typescript
// src/types/preset.ts
export interface VideoPresetSettings {
  // Calidad de Video
  videoBitrate: { min: number; max: number; enabled: boolean };
  audioBitrate: { min: number; max: number; enabled: boolean };
  frameRate: { min: number; max: number; enabled: boolean };
  
  // Ajustes de Color
  saturation: { min: number; max: number; enabled: boolean };
  contrast: { min: number; max: number; enabled: boolean };
  brightness: { min: number; max: number; enabled: boolean };
  gamma: { min: number; max: number; enabled: boolean };
  
  // Efectos Visuales
  vignette: { min: number; max: number; enabled: boolean };
  noise: { min: number; max: number; enabled: boolean };
  waveformShift: { min: number; max: number; enabled: boolean };
  pixelShift: { min: number; max: number; enabled: boolean };
  
  // Transformaciones
  speed: { min: number; max: number; enabled: boolean };
  zoom: { min: number; max: number; enabled: boolean };
  rotation: { min: number; max: number; enabled: boolean };
  flipHorizontal: boolean;
  
  // Tamaño y Recorte
  pixelSize: string;
  randomPixelSize: boolean;
  trimStart: { min: number; max: number; enabled: boolean };
  trimEnd: { min: number; max: number; enabled: boolean };
  
  // Características Especiales
  usMetadata: boolean;
  blurredBorder: { min: number; max: number; enabled: boolean };
  
  // Audio
  volume: { min: number; max: number; enabled: boolean };
  
  // Marca de Agua
  watermark: {
    enabled: boolean;
    size: number;
    opacity: number;
    x: number;
    y: number;
  };
  
  name?: string;
}

export interface QueueItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  progress: number;
  results?: { name: string; url: string; processingDetails?: any }[];
  error?: string;
  settings?: VideoPresetSettings;
  numCopies?: number;
}
```

---

## 4. PROCESO DE RECEPCIÓN Y MANEJO DE VIDEOS

### 4.1 Hook de Procesamiento Principal
```typescript
// src/hooks/useVideoProcessing.ts
export const useVideoProcessing = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    try {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setUploadedFileUrl(url);
      
      toast({
        title: "File selected",
        description: `${file.name} ready for processing`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load video file",
        variant: "destructive"
      });
    }
  };

  const processVideo = async (numCopies: number, settings: VideoPresetSettings) => {
    if (!uploadedFile) return;
    
    setProcessing(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('video', uploadedFile);
      formData.append('settings', JSON.stringify(settings));
      formData.append('numCopies', numCopies.toString());

      // Llamar a la Edge Function de Supabase
      const { data, error } = await supabase.functions.invoke('process-video', {
        body: formData
      });

      if (error) throw error;
      
      setResults(data.results || []);
      setProgress(100);
      
      toast({
        title: "Processing complete",
        description: `Generated ${data.results?.length || 0} video variants`,
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return {
    uploadedFile,
    uploadedFileUrl,
    processing,
    progress,
    results,
    handleFileSelect,
    processVideo,
    setResults
  };
};
```

### 4.2 Sistema de Cola para Múltiples Videos
```typescript
// src/hooks/useVideoQueue.ts
export const useVideoQueue = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentItem, setCurrentItem] = useState<string | null>(null);

  const addVideosToQueue = useCallback((files: File[], settings: VideoPresetSettings, numCopies: number) => {
    const newItems: QueueItem[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      fileName: file.name,
      fileSize: file.size,
      status: 'waiting',
      progress: 0,
      settings: { ...settings },
      numCopies
    }));

    setQueue(prev => [...prev, ...newItems]);
    return newItems;
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing) return;
    
    const waitingItems = queue.filter(item => item.status === 'waiting');
    if (waitingItems.length === 0) return;

    setIsProcessing(true);

    for (const item of waitingItems) {
      try {
        setCurrentItem(item.id);
        updateItemStatus(item.id, { status: 'processing', progress: 0 });

        const formData = new FormData();
        formData.append('video', item.file);
        formData.append('settings', JSON.stringify(item.settings));
        formData.append('numCopies', (item.numCopies || 3).toString());

        const { data, error } = await supabase.functions.invoke('process-video', {
          body: formData
        });

        if (error) throw error;
        
        updateItemStatus(item.id, { 
          status: 'completed', 
          progress: 100, 
          results: data.results 
        });
      } catch (error) {
        updateItemStatus(item.id, { 
          status: 'error', 
          error: error.message,
          progress: 0 
        });
      }
    }

    setCurrentItem(null);
    setIsProcessing(false);
  }, [queue, isProcessing]);

  return {
    queue,
    isProcessing,
    currentItem,
    addVideosToQueue,
    processQueue,
    // ... otras funciones de gestión
  };
};
```

---

## 5. APLICACIÓN DE EFECTOS Y PROCESAMIENTO

### 5.1 Generación de Parámetros Aleatorios
```typescript
// src/utils/videoProcessing.ts
export const generateProcessingParameters = (settings: VideoPresetSettings) => {
  const getRandomValue = (min: number, max: number) => Math.random() * (max - min) + min;
  
  return {
    // Calidad de video
    videoBitrate: settings.videoBitrate.enabled 
      ? Math.floor(getRandomValue(settings.videoBitrate.min, settings.videoBitrate.max))
      : null,
    
    // Ajustes de color
    saturation: settings.saturation.enabled 
      ? getRandomValue(settings.saturation.min, settings.saturation.max)
      : 1.0,
    contrast: settings.contrast.enabled 
      ? getRandomValue(settings.contrast.min, settings.contrast.max)
      : 1.0,
    brightness: settings.brightness.enabled 
      ? getRandomValue(settings.brightness.min, settings.brightness.max)
      : 0.0,
    
    // Efectos
    vignette: settings.vignette.enabled 
      ? getRandomValue(settings.vignette.min, settings.vignette.max)
      : 0,
    noise: settings.noise.enabled 
      ? getRandomValue(settings.noise.min, settings.noise.max)
      : 0,
    
    // Transformaciones
    speed: settings.speed.enabled 
      ? getRandomValue(settings.speed.min, settings.speed.max)
      : 1.0,
    zoom: settings.zoom.enabled 
      ? getRandomValue(settings.zoom.min, settings.zoom.max)
      : 1.0,
    rotation: settings.rotation.enabled 
      ? getRandomValue(settings.rotation.min, settings.rotation.max)
      : 0,
    
    flipHorizontal: settings.flipHorizontal,
    
    // Audio
    volume: settings.volume.enabled 
      ? getRandomValue(settings.volume.min, settings.volume.max)
      : 1.0,
    
    // Marca de agua
    watermark: settings.watermark.enabled ? {
      size: settings.watermark.size,
      opacity: settings.watermark.opacity,
      x: settings.watermark.x,
      y: settings.watermark.y
    } : null
  };
};

export const buildComplexFilter = (params: any, settings: VideoPresetSettings) => {
  let filters = [];
  
  // Ajustes de color
  if (settings.saturation.enabled || settings.contrast.enabled || settings.brightness.enabled) {
    filters.push(`eq=saturation=${params.saturation}:contrast=${params.contrast}:brightness=${params.brightness}`);
  }
  
  // Efectos de ruido
  if (settings.noise.enabled && params.noise > 0) {
    filters.push(`noise=alls=${params.noise}:allf=t+u`);
  }
  
  // Viñeta
  if (settings.vignette.enabled && params.vignette > 0) {
    filters.push(`vignette=angle=PI/4:x0=w/2:y0=h/2:mode=backward:eval=frame`);
  }
  
  // Rotación
  if (settings.rotation.enabled && params.rotation !== 0) {
    filters.push(`rotate=${params.rotation}*PI/180:fillcolor=black:out_w=rotw(${params.rotation}*PI/180):out_h=roth(${params.rotation}*PI/180)`);
  }
  
  // Zoom
  if (settings.zoom.enabled && params.zoom !== 1.0) {
    filters.push(`scale=iw*${params.zoom}:ih*${params.zoom}`);
  }
  
  // Flip horizontal
  if (params.flipHorizontal) {
    filters.push('hflip');
  }
  
  return filters.join(',');
};
```

### 5.2 Configuración de Valores por Defecto
```typescript
// Configuración inicial recomendada
const defaultSettings: VideoPresetSettings = {
  // Calidad
  videoBitrate: { min: 500, max: 2000, enabled: true },
  audioBitrate: { min: 128, max: 320, enabled: true },
  frameRate: { min: 24, max: 30, enabled: false },
  
  // Color
  saturation: { min: 0.8, max: 1.2, enabled: true },
  contrast: { min: 0.9, max: 1.1, enabled: true },
  brightness: { min: -0.1, max: 0.1, enabled: true },
  gamma: { min: 0.8, max: 1.2, enabled: false },
  
  // Efectos
  vignette: { min: 0, max: 0.3, enabled: false },
  noise: { min: 0, max: 10, enabled: false },
  waveformShift: { min: 0, max: 5, enabled: false },
  pixelShift: { min: 0, max: 2, enabled: false },
  
  // Transformaciones
  speed: { min: 0.95, max: 1.05, enabled: true },
  zoom: { min: 1.0, max: 1.02, enabled: true },
  rotation: { min: -1, max: 1, enabled: false },
  flipHorizontal: false,
  
  // Tamaño y recorte
  pixelSize: "original",
  randomPixelSize: false,
  trimStart: { min: 0, max: 2, enabled: false },
  trimEnd: { min: 0, max: 2, enabled: false },
  
  // Especiales
  usMetadata: false,
  blurredBorder: { min: 0, max: 10, enabled: false },
  
  // Audio
  volume: { min: 0.9, max: 1.1, enabled: true },
  
  // Marca de agua
  watermark: {
    enabled: false,
    size: 50,
    opacity: 0.5,
    x: 10,
    y: 10
  }
};
```

---

## 6. INTERFAZ DE USUARIO Y COMPONENTES

### 6.1 Componente Principal
```typescript
// src/pages/VideoRepurposer.tsx
export const VideoRepurposer = () => {
  const [activeTab, setActiveTab] = useState("process");
  const [numCopies, setNumCopies] = useState(3);
  const [showPreview, setShowPreview] = useState(false);
  
  const { 
    uploadedFile, uploadedFileUrl, processing, progress, results,
    handleFileSelect, processVideo, setResults 
  } = useVideoProcessing();
  
  const {
    queue, isProcessing, currentItem,
    addVideosToQueue, processQueue, removeFromQueue, clearQueue, retryItem
  } = useVideoQueue();
  
  const { presets, savePreset, loadPreset, deletePreset } = usePresets();
  const [settings, setSettings] = useState<VideoPresetSettings>(defaultSettings);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Video Repurposer</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Generate multiple unique video variants with randomized effects and transformations
            </p>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="process">Process Video</TabsTrigger>
              <TabsTrigger value="presets">Manage Presets</TabsTrigger>
              <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="process">
              <ProcessTab 
                uploadedFile={uploadedFile}
                uploadedFileUrl={uploadedFileUrl}
                processing={processing}
                progress={progress}
                numCopies={numCopies}
                setNumCopies={setNumCopies}
                settings={settings}
                setSettings={setSettings}
                handleFileSelect={handleFileSelect}
                handleStartProcess={() => processVideo(numCopies, settings)}
                // ... props para queue
              />
            </TabsContent>

            <TabsContent value="presets">
              <PresetManager 
                presets={presets}
                currentSettings={settings}
                onLoadPreset={loadPreset}
                onSavePreset={savePreset}
                onDeletePreset={deletePreset}
              />
            </TabsContent>

            <TabsContent value="results">
              <ResultsTab 
                results={results}
                handlePreview={(name, url) => setShowPreview(true)}
                handleDownload={handleDownload}
                handleDownloadAll={handleDownloadAll}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {showPreview && (
        <VideoPreview 
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          videoUrl={previewUrl}
          fileName={previewFileName}
        />
      )}
    </div>
  );
};
```

### 6.2 Componente de Cola de Videos
```typescript
// src/components/video/VideoQueue.tsx
export const VideoQueue: React.FC<VideoQueueProps> = ({
  queue, isProcessing, currentItem, onRemove, onRetry, onClear
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Processing Queue ({queue.length})</h3>
        {queue.length > 0 && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
      
      {queue.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No videos in queue
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Video className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{item.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {(item.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusVariant(item.status)}>
                    {item.status}
                  </Badge>
                  
                  {item.status === 'error' && (
                    <Button size="sm" variant="outline" onClick={() => onRetry(item.id)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onRemove(item.id)}
                    disabled={item.status === 'processing'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {item.status === 'processing' && (
                <Progress value={item.progress} className="w-full" />
              )}
              
              {item.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{item.error}</AlertDescription>
                </Alert>
              )}
              
              {item.results && item.results.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {item.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm truncate">{result.name}</span>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => onPreview(result.name, result.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onDownload(result.name, result.url)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 7. VISUALIZACIÓN DE RESULTADOS

### 7.1 Tarjetas de Video
```typescript
// src/components/video/VideoCard.tsx
export const VideoCard: React.FC<VideoCardProps> = ({ result, onPreview, onDownload }) => {
  const [thumbnail, setThumbnail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateThumbnail(result.url).then(setThumbnail).finally(() => setLoading(false));
  }, [result.url]);

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <div className="aspect-video relative">
        {loading ? (
          <Skeleton className="w-full h-full" />
        ) : thumbnail ? (
          <img 
            src={thumbnail} 
            alt={result.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-2">
            <Button size="sm" onClick={() => onPreview(result.name, result.url)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onDownload(result.name, result.url)}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h4 className="font-medium truncate mb-2">{result.name}</h4>
        
        {result.processingDetails && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Quality: {result.processingDetails.videoBitrate}k</div>
            <div>Effects: {result.processingDetails.effectsApplied?.join(', ')}</div>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3">
          <Badge variant="secondary" className="text-xs">
            Video
          </Badge>
          <div className="flex space-x-1">
            <Button size="sm" variant="ghost" onClick={() => onPreview(result.name, result.url)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDownload(result.name, result.url)}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 7.2 Modal de Previsualización
```typescript
// src/components/video/VideoPreview.tsx
export const VideoPreview: React.FC<VideoPreviewProps> = ({
  isOpen, onClose, videoUrl, fileName
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <video 
            src={videoUrl}
            controls
            className="w-full h-auto max-h-[70vh] rounded-lg"
            preload="metadata"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => downloadFile(videoUrl, fileName)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 8. SISTEMA DE DESCARGA

### 8.1 Funciones de Descarga
```typescript
// Utilidades para descarga
export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

export const downloadMultipleFiles = async (files: Array<{name: string, url: string}>) => {
  const zip = new JSZip();
  
  for (const file of files) {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      zip.file(file.name, blob);
    } catch (error) {
      console.error(`Failed to download ${file.name}:`, error);
    }
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(zipBlob);
  
  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = 'processed_videos.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(zipUrl);
};
```

---

## 9. SISTEMA DE PRESETS

### 9.1 Hook de Gestión de Presets
```typescript
// src/hooks/usePresets.ts
export const usePresets = () => {
  const [presets, setPresets] = useState<VideoPresetSettings[]>([]);

  useEffect(() => {
    loadPresetsFromStorage();
  }, []);

  const savePreset = useCallback((preset: VideoPresetSettings) => {
    const newPreset = { ...preset, name: preset.name || `Preset ${Date.now()}` };
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('videoPresets', JSON.stringify(updatedPresets));
  }, [presets]);

  const loadPreset = useCallback((presetName: string) => {
    return presets.find(p => p.name === presetName);
  }, [presets]);

  const deletePreset = useCallback((presetName: string) => {
    const filtered = presets.filter(p => p.name !== presetName);
    setPresets(filtered);
    localStorage.setItem('videoPresets', JSON.stringify(filtered));
  }, [presets]);

  const loadPresetsFromStorage = () => {
    try {
      const stored = localStorage.getItem('videoPresets');
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  return { presets, savePreset, loadPreset, deletePreset };
};
```

---

## 10. CONFIGURACIÓN DE DISEÑO

### 10.1 Tokens Semánticos en index.css
```css
:root {
  /* Colores principales */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
  
  /* Colores específicos para video */
  --video-bg: 0 0% 2%;
  --video-accent: 142.1 76.2% 36.3%;
  --processing: 47.9 95.8% 53.1%;
  --completed: 142.1 76.2% 36.3%;
  --error: 0 84.2% 60.2%;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 0 0% 14.9%;
  --accent-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 0 0% 83.1%;
  
  --video-bg: 0 0% 6%;
}
```

### 10.2 Configuración de Tailwind
```javascript
// tailwind.config.ts
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        video: {
          bg: "hsl(var(--video-bg))",
          accent: "hsl(var(--video-accent))",
        },
        status: {
          processing: "hsl(var(--processing))",
          completed: "hsl(var(--completed))",
          error: "hsl(var(--error))",
        }
      },
      animation: {
        "processing": "pulse 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 11. MANEJO DE ERRORES Y OPTIMIZACIÓN

### 11.1 Sistema de Notificaciones
```typescript
// Integrar con react-hot-toast o el sistema de toast de shadcn
export const useVideoNotifications = () => {
  const { toast } = useToast();

  const notifyProcessingStart = (fileName: string) => {
    toast({
      title: "Processing started",
      description: `${fileName} is being processed...`,
    });
  };

  const notifyProcessingComplete = (fileName: string, variantsCount: number) => {
    toast({
      title: "Processing complete",
      description: `${fileName} generated ${variantsCount} variants`,
    });
  };

  const notifyError = (error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  };

  return { notifyProcessingStart, notifyProcessingComplete, notifyError };
};
```

### 11.2 Optimizaciones de Rendimiento
```typescript
// Lazy loading de componentes pesados
const VideoPreview = lazy(() => import('./components/video/VideoPreview'));
const ProcessingPanel = lazy(() => import('./components/video/VideoProcessingPanel'));

// Memoización de componentes costosos
const MemoizedVideoCard = memo(VideoCard);
const MemoizedParameterSection = memo(ParameterSection);

// Debounce para ajustes de parámetros
const debouncedUpdateSetting = useMemo(
  () => debounce((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, 300),
  []
);
```

---

## 12. CRITERIOS DE ACEPTACIÓN

### Funcionalidades Mínimas Requeridas:
1. ✅ Upload de videos individuales y múltiples
2. ✅ Sistema de configuración de parámetros con rangos min/max
3. ✅ Generación de múltiples variantes (3-10)
4. ✅ Sistema de cola para procesamiento en lote
5. ✅ Visualización de progreso en tiempo real
6. ✅ Previsualización de videos procesados
7. ✅ Descarga individual y masiva (ZIP)
8. ✅ Sistema de presets para guardar configuraciones
9. ✅ Integración completa con Supabase (Storage + Edge Functions)
10. ✅ Interfaz responsive y accesible

### Indicadores de Rendimiento:
- Procesamiento de videos hasta 100MB sin errores
- Interfaz responsive en dispositivos móviles
- Tiempos de carga inferiores a 3 segundos
- Manejo graceful de errores con mensajes informativos
- Capacidad de manejar colas de hasta 50 videos

### Casos de Prueba Específicos:
1. Subir video MP4 de 50MB y generar 5 variantes
2. Configurar preset personalizado y aplicarlo a múltiples videos
3. Procesar cola de 10 videos diferentes
4. Descargar todas las variantes en un ZIP
5. Previsualizar videos en el modal

---

## ENTREGABLES FINALES

1. **Aplicación completamente funcional** con todas las características descritas
2. **Integración Supabase** configurada y probada
3. **Documentación de uso** para usuarios finales
4. **Tests básicos** para funcionalidades críticas
5. **Configuración de deploy** lista para producción

**NOTA IMPORTANTE**: Esta implementación debe ser robusta, escalable y libre de los problemas de rendimiento que presenta la versión actual. Prioriza la estabilidad y la experiencia de usuario sobre características avanzadas.