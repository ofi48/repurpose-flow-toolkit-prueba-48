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

  // Clear old queue data from localStorage on mount to prevent showing stale videos
  useEffect(() => {
    localStorage.removeItem('videoQueue');
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