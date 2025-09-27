import { useState, useCallback } from 'react';
import { ImagePresetSettings } from '@/types/preset';
import { useToast } from "@/hooks/use-toast";
import { useGlobalResults } from '@/hooks/useGlobalResults';

export interface ImageQueueItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  progress: number;
  results?: { name: string; url: string; processingDetails?: any }[];
  error?: string;
  settings?: ImagePresetSettings;
  numCopies?: number;
}

export const useImageQueue = () => {
  const [queue, setQueue] = useState<ImageQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const { toast } = useToast();
  const { addResults } = useGlobalResults();

  const addImagesToQueue = useCallback((files: File[], settings: ImagePresetSettings, numCopies: number) => {
    const newItems: ImageQueueItem[] = files.map(file => ({
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
      title: "Images added to queue",
      description: `${files.length} image${files.length > 1 ? 's' : ''} added to the processing queue.`,
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

  const updateItemStatus = useCallback((id: string, updates: Partial<ImageQueueItem>) => {
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

  const applyImageEffects = async (file: File, settings: ImagePresetSettings, variantIndex: number): Promise<{ name: string; url: string; processingDetails?: any }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;

        // Random flip horizontal
        const shouldFlip = settings.flipHorizontal && Math.random() > 0.5;
        if (shouldFlip) {
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
        }

        // Apply filter effects
        const filters = [];
        const processingDetails: any = { variantIndex: variantIndex + 1 };
        
        if (settings.brightness.enabled) {
          const brightness = Math.random() * (settings.brightness.max - settings.brightness.min) + settings.brightness.min;
          filters.push(`brightness(${brightness})`);
          processingDetails.brightness = brightness;
        }
        
        if (settings.contrast.enabled) {
          const contrast = Math.random() * (settings.contrast.max - settings.contrast.min) + settings.contrast.min;
          filters.push(`contrast(${contrast})`);
          processingDetails.contrast = contrast;
        }
        
        if (settings.saturation.enabled) {
          const saturation = Math.random() * (settings.saturation.max - settings.saturation.min) + settings.saturation.min;
          filters.push(`saturate(${saturation})`);
          processingDetails.saturation = saturation;
        }

        ctx.filter = filters.join(' ');
        ctx.drawImage(img, 0, 0);

        // Apply blur border if enabled
        if (settings.blurBorder) {
          const borderSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.02);
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - borderSize,
            canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2
          );
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
          
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          processingDetails.blurBorder = true;
        }

        // Convert to blob with compression
        const quality = settings.compression.enabled 
          ? (Math.random() * (settings.compression.max - settings.compression.min) + settings.compression.min) / 100
          : 0.9;

        if (settings.compression.enabled) {
          processingDetails.compression = quality * 100;
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const name = `${file.name.split('.')[0]}_variant_${variantIndex + 1}.${file.name.split('.').pop()}`;
            resolve({ name, url, processingDetails });
          }
        }, `image/${file.name.split('.').pop() === 'png' ? 'png' : 'jpeg'}`, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const processImage = async (item: ImageQueueItem) => {
    if (!item.file || !item.settings) {
      throw new Error('Incomplete image data');
    }

    const copies = Math.max(1, item.numCopies || 1);
    const aggregatedResults: { name: string; url: string; processingDetails?: any }[] = [];

    for (let i = 0; i < copies; i++) {
      try {
        const result = await applyImageEffects(item.file, item.settings, i);
        aggregatedResults.push(result);
        
        // Update progress for each variant
        const progressPerVariant = 100 / copies;
        const currentProgress = (i + 1) * progressPerVariant;
        updateItemStatus(item.id, { progress: Math.round(currentProgress) });
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing variation ${i + 1} for queue item:`, error);
        throw error;
      }
    }

    return aggregatedResults;
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

        const results = await processImage(item);
        
        updateItemStatus(item.id, { 
          status: 'completed', 
          progress: 100, 
          results 
        });

        // Add to global results
        addResults(results, 'batch');

        toast({
          title: "Image processed",
          description: `${item.fileName} has been processed successfully.`,
          variant: "default"
        });

      } catch (error) {
        console.error(`Error processing ${item.fileName}:`, error);
        updateItemStatus(item.id, { 
          status: 'error', 
          error: error.message || 'Unknown error',
          progress: 0 
        });

        toast({
          title: "Processing error",
          description: `Error processing ${item.fileName}: ${error.message}`,
          variant: "destructive"
        });
      }
    }

    setCurrentItem(null);
    setIsProcessing(false);

    const completedCount = queue.filter(item => item.status === 'completed').length;
    if (completedCount > 0) {
      toast({
        title: "Queue processed",
        description: `${completedCount} images have been processed successfully.`,
        variant: "default"
      });
    }
  }, [queue, isProcessing, updateItemStatus, toast, addResults]);

  return {
    queue,
    isProcessing,
    currentItem,
    addImagesToQueue,
    removeFromQueue,
    clearQueue,
    retryItem,
    processQueue,
    updateItemStatus
  };
};