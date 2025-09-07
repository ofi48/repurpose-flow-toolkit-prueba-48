import React, { createContext, useContext, useEffect } from 'react';
import { useVideoQueue } from '@/hooks/useVideoQueue';
import { useGlobalResults } from '@/hooks/useGlobalResults';
import { VideoPresetSettings } from '@/types/preset';

interface VideoQueueContextType {
  // Queue management
  queue: any[];
  isProcessing: boolean;
  currentItem: string | null;
  addVideosToQueue: (files: File[], settings: VideoPresetSettings, numCopies: number) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  retryItem: (id: string) => void;
  processQueue: () => Promise<void>;
  
  // Global results
  globalResults: any[];
  addResults: (results: any[], source: 'single' | 'batch') => any[];
  clearResults: () => void;
  removeResult: (id: string) => void;
}

const VideoQueueContext = createContext<VideoQueueContextType | undefined>(undefined);

export const VideoQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoQueue = useVideoQueue();
  const globalResults = useGlobalResults();

  // Persist queue to localStorage when it changes
  useEffect(() => {
    if (videoQueue.queue.length > 0) {
      localStorage.setItem('videoQueue', JSON.stringify(videoQueue.queue));
    }
  }, [videoQueue.queue]);

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('videoQueue');
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue);
        // Only restore completed items (not processing ones)
        const completedItems = parsedQueue.filter((item: any) => 
          item.status === 'completed' || item.status === 'error'
        );
        if (completedItems.length > 0) {
          // Add to global results if completed
          const completedResults = completedItems
            .filter((item: any) => item.status === 'completed' && item.results)
            .flatMap((item: any) => item.results.map((result: any) => ({
              name: result.name,
              url: result.url,
              processingDetails: result.processingDetails
            })));
          
          if (completedResults.length > 0) {
            globalResults.addResults(completedResults, 'batch');
          }
        }
      } catch (error) {
        console.error('Error loading saved queue:', error);
      }
    }
  }, []);

  const value: VideoQueueContextType = {
    ...videoQueue,
    ...globalResults,
  };

  return (
    <VideoQueueContext.Provider value={value}>
      {children}
    </VideoQueueContext.Provider>
  );
};

export const useVideoQueueContext = () => {
  const context = useContext(VideoQueueContext);
  if (context === undefined) {
    throw new Error('useVideoQueueContext must be used within a VideoQueueProvider');
  }
  return context;
};