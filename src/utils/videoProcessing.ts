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

// Build filter string for video processing (for API reference)
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

// Server-side processing function that connects to Railway
export const processVideoOnServer = async (file: File, params: any) => {
  console.log('Sending video to Railway server for processing:', { params });
  
  try {
    // Create form data to send to Railway
    const formData = new FormData();
    formData.append('video', file);
    formData.append('params', JSON.stringify(params));
    
    // Set Railway server URL - replace with your actual Railway URL
    // Using the port 8080 you mentioned for local development
    const railwayServerUrl = 'http://localhost:8080/process-video';
    
    // Send request to Railway server
    const response = await fetch(railwayServerUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error processing video on Railway server');
    }
    
    const data = await response.json();
    
    // Return processed video data
    return {
      url: data.url || URL.createObjectURL(file), // Use returned URL or fallback to original
      name: data.name || `processed_${file.name}`,
      processingDetails: params
    };
  } catch (error) {
    console.error('Error processing video on Railway server:', error);
    throw error;
  }
};
