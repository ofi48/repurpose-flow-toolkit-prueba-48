
import { useState, useEffect } from 'react';
import { createFFmpeg } from '@ffmpeg/ffmpeg';

// Initialize FFmpeg
const ffmpeg = createFFmpeg({ 
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

export const useFFmpeg = () => {
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  // Load FFmpeg on component mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpeg.isLoaded()) {
          await ffmpeg.load();
          console.log('FFmpeg loaded successfully');
          setFfmpegLoaded(true);
        }
      } catch (error) {
        console.error('Error loading FFmpeg:', error);
      }
    };
    
    loadFFmpeg();
  }, []);

  return {
    ffmpeg,
    ffmpegLoaded
  };
};
