
import { VideoPresetSettings } from '@/types/preset';

// Generate a random number between min and max
export const getRandomValue = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

// Get values for processing parameters based on settings
export const generateProcessingParameters = (settings: VideoPresetSettings) => {
  const params = {
    speed: settings.speed.enabled ? getRandomValue(settings.speed.min, settings.speed.max) : 1,
    trimStart: settings.trimStart.enabled ? getRandomValue(settings.trimStart.min, settings.trimStart.max) : 0,
    trimEnd: settings.trimEnd.enabled ? getRandomValue(settings.trimEnd.min, settings.trimEnd.max) : 0,
    saturation: settings.saturation.enabled ? getRandomValue(settings.saturation.min, settings.saturation.max) : 1,
    contrast: settings.contrast.enabled ? getRandomValue(settings.contrast.min, settings.contrast.max) : 1,
    brightness: settings.brightness.enabled ? getRandomValue(settings.brightness.min, settings.brightness.max) : 1,
    audioBitrate: settings.audioBitrate.enabled ? Math.round(getRandomValue(settings.audioBitrate.min, settings.audioBitrate.max)) : 128,
    flipHorizontal: settings.flipHorizontal
  };
  
  return params;
};

// Build filter string for video processing (for API reference, not used locally)
export const buildComplexFilter = (params, settings: VideoPresetSettings) => {
  let filter = '';
  
  // Add saturation filter if enabled
  if (settings.saturation.enabled) {
    filter += `eq=saturation=${params.saturation}:`;
  }
  
  // Add contrast filter if enabled
  if (settings.contrast.enabled) {
    filter += `contrast=${params.contrast}:`;
  }
  
  // Add brightness filter if enabled
  if (settings.brightness.enabled) {
    filter += `brightness=${params.brightness}`;
  }
  
  // Remove trailing colon if present
  if (filter.endsWith(':')) {
    filter = filter.slice(0, -1);
  }
  
  // Add flip filter if enabled
  if (params.flipHorizontal) {
    filter = filter ? `${filter},hflip` : 'hflip';
  }
  
  return filter;
};

// Server-side processing function (stub for future implementation)
export const processVideoOnServer = async (file: File, params: any) => {
  // This would be implemented to call your backend API
  console.log('This would send the video to a server for processing:', { file, params });
  
  // Example implementation:
  /*
  const formData = new FormData();
  formData.append('video', file);
  formData.append('params', JSON.stringify(params));
  
  const response = await fetch('https://your-api.com/process-video', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
  */
  
  // For now, return a mock implementation
  return {
    url: URL.createObjectURL(file),
    name: `processed_${file.name}`,
    processingDetails: params
  };
};
