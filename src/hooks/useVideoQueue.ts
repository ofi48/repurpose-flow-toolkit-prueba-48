import { useState, useCallback } from 'react';
import { VideoPresetSettings } from '@/types/preset';
import { useToast } from "@/hooks/use-toast";
import { generateProcessingParameters, processVideoOnServer } from '@/utils/videoProcessing';

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

export const useVideoQueue = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const { toast } = useToast();

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
    
    toast({
      title: "Videos añadidos a la cola",
      description: `${files.length} video${files.length > 1 ? 's' : ''} añadido${files.length > 1 ? 's' : ''} a la cola de procesamiento.`,
      variant: "default"
    });

    return newItems;
  }, [toast]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentItem(null);
    setIsProcessing(false);
  }, []);

  const updateItemStatus = useCallback((id: string, updates: Partial<QueueItem>) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const retryItem = useCallback((id: string) => {
    updateItemStatus(id, { 
      status: 'waiting', 
      progress: 0, 
      error: undefined, 
      results: undefined 
    });
  }, [updateItemStatus]);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return newQueue;
    });
  }, []);

  const processVideo = async (item: QueueItem) => {
    if (!item.file || !item.settings) {
      throw new Error('Datos de video incompletos');
    }

    const formData = new FormData();
    formData.append('video', item.file);
    formData.append('settings', JSON.stringify(item.settings));
    formData.append('numCopies', (item.numCopies || 3).toString());

    try {
      const response = await fetch('https://video-server-production-d7af.up.railway.app/process-video', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`El servidor devolvió un formato inesperado. Content-Type: ${contentType || 'undefined'}`);
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        throw new Error('Error al procesar la respuesta del servidor.');
      }

      if (!response.ok) {
        const errorMsg = responseData.error || "Error en el procesamiento";
        throw new Error(errorMsg);
      }

      if (responseData.results && Array.isArray(responseData.results)) {
        const processedVideos = responseData.results.map(result => ({
          name: result.name,
          url: result.url.startsWith('http') ? result.url : `https://video-server-production-d7af.up.railway.app${result.url}`,
          processingDetails: result.processingDetails
        }));
        
        return processedVideos;
      }

      return [];
    } catch (error) {
      throw error;
    }
  };

  const processQueue = useCallback(async () => {
    if (isProcessing) return;

    const waitingItems = queue.filter(item => item.status === 'waiting');
    if (waitingItems.length === 0) return;

    setIsProcessing(true);

    for (const item of waitingItems) {
      try {
        setCurrentItem(item.id);
        updateItemStatus(item.id, { status: 'processing', progress: 0 });

        // Simular progreso
        for (let progress = 0; progress <= 80; progress += 20) {
          updateItemStatus(item.id, { progress });
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const results = await processVideo(item);
        
        updateItemStatus(item.id, { 
          status: 'completed', 
          progress: 100, 
          results 
        });

        toast({
          title: "Video procesado",
          description: `${item.fileName} se ha procesado correctamente.`,
          variant: "default"
        });

      } catch (error) {
        console.error(`Error procesando ${item.fileName}:`, error);
        updateItemStatus(item.id, { 
          status: 'error', 
          error: error.message || 'Error desconocido',
          progress: 0 
        });

        toast({
          title: "Error en el procesamiento",
          description: `Error al procesar ${item.fileName}: ${error.message}`,
          variant: "destructive"
        });
      }
    }

    setCurrentItem(null);
    setIsProcessing(false);

    const completedCount = queue.filter(item => item.status === 'completed').length;
    if (completedCount > 0) {
      toast({
        title: "Cola procesada",
        description: `Se han procesado ${completedCount} videos correctamente.`,
        variant: "default"
      });
    }
  }, [queue, isProcessing, updateItemStatus, toast]);

  return {
    queue,
    isProcessing,
    currentItem,
    addVideosToQueue,
    removeFromQueue,
    clearQueue,
    retryItem,
    reorderQueue,
    processQueue,
    updateItemStatus
  };
};