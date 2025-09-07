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
      title: "Videos added to queue",
      description: `${files.length} video${files.length > 1 ? 's' : ''} added to the processing queue.`,
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
      throw new Error('Incomplete video data');
    }

    const copies = Math.max(1, item.numCopies || 1);
    const aggregatedResults: { name: string; url: string; processingDetails?: any }[] = [];

    for (let i = 0; i < copies; i++) {
      const formData = new FormData();
      formData.append('video', item.file);
      formData.append('settings', JSON.stringify(item.settings));
      try {
        // Generate per-variation parameters (if server supports them)
        const variationParams = generateProcessingParameters(item.settings);
        formData.append('params', JSON.stringify(variationParams));
      } catch {
        // ignore param generation errors
      }

      try {
        const response = await fetch('https://video-server-production-a86c.up.railway.app/process-video', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          await response.text();
          throw new Error(`Server returned unexpected format. Content-Type: ${contentType || 'undefined'}`);
        }

        let responseData: any;
        try {
          responseData = await response.json();
        } catch (jsonError) {
          throw new Error('Error processing server response.');
        }

        if (!response.ok) {
          const errorMsg = responseData?.error || 'Processing error';
          throw new Error(errorMsg);
        }

        if (responseData.results && Array.isArray(responseData.results)) {
          const processedVideos = responseData.results.map((result: any, idx: number) => ({
            name: result.name || `processed_${i + 1}_${idx + 1}_${item.file.name}`,
            url: (result.url && result.url.startsWith('http'))
              ? result.url.replace('http://', 'https://')
              : `https://video-server-production-a86c.up.railway.app${result.url}`.replace('http://', 'https://'),
            processingDetails: result.processingDetails || { copyIndex: i + 1 }
          }));
          aggregatedResults.push(...processedVideos);
        } else if (responseData.success && responseData.videoUrl) {
          const secureUrl = String(responseData.videoUrl).replace('http://', 'https://');
          aggregatedResults.push({
            name: `processed_${i + 1}_${item.file.name}`,
            url: secureUrl,
            processingDetails: { ...responseData, copyIndex: i + 1 }
          });
        } else {
          console.warn('Unexpected response format for queue item:', responseData);
        }
      } catch (error) {
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
          title: "Video processed",
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
        description: `${completedCount} videos have been processed successfully.`,
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