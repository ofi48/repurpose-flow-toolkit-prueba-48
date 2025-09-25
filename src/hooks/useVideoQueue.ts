import { useState, useCallback } from 'react';
import { VideoPresetSettings } from '@/types/preset';
import { useToast } from "@/hooks/use-toast";
import { generateProcessingParameters, processVideoOnServer } from '@/utils/videoProcessing';
import { useGlobalResults } from '@/hooks/useGlobalResults';

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
  const { addResults } = useGlobalResults();

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
      try {
        // Generate per-variation parameters with unique variation index
        const variationParams = generateProcessingParameters(item.settings, i);
        console.log(`Generated variation ${i + 1} parameters:`, variationParams);
        
        // Use the enhanced processVideoOnServer function
        const result = await processVideoOnServer(item.file, variationParams, item.settings);
        
        // Handle the result
        if (Array.isArray(result)) {
          aggregatedResults.push(...result);
        } else {
          const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          aggregatedResults.push({
            name: `processed_var${i + 1}_${uniqueId}_${item.file.name}`,
            url: result.url,
            processingDetails: result.processingDetails || { ...variationParams, copyIndex: i + 1 }
          });
        }
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

        // Add to global results
        addResults(results, 'batch');

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