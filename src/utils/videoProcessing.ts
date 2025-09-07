
import { VideoPresetSettings } from '@/types/preset';

// Generate a random number between min and max
export const getRandomValue = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

// Get values for processing parameters based on settings - simplified to what actually works
export const generateProcessingParameters = (settings: VideoPresetSettings) => {
  const params = {
    // Video Quality
    videoBitrate: settings.videoBitrate?.enabled ? Math.round(getRandomValue(settings.videoBitrate.min, settings.videoBitrate.max)) : 8000,
    frameRate: settings.frameRate?.enabled ? Math.round(getRandomValue(settings.frameRate.min, settings.frameRate.max)) : 30,
    
    // Color Adjustments - Core parameters that work reliably
    saturation: settings.saturation?.enabled ? getRandomValue(settings.saturation.min, settings.saturation.max) : 1,
    contrast: settings.contrast?.enabled ? getRandomValue(settings.contrast.min, settings.contrast.max) : 1,
    brightness: settings.brightness?.enabled ? getRandomValue(settings.brightness.min, settings.brightness.max) : 0,
    
    // Simple Transformations
    speed: settings.speed?.enabled ? getRandomValue(settings.speed.min, settings.speed.max) : 1,
    flipHorizontal: settings.flipHorizontal || false,
    
    // Trim timing
    trimStart: settings.trimStart?.enabled ? getRandomValue(settings.trimStart.min, settings.trimStart.max) : 0,
    trimEnd: settings.trimEnd?.enabled ? getRandomValue(settings.trimEnd.min, settings.trimEnd.max) : 0,
    
    // Audio
    volume: settings.volume?.enabled ? getRandomValue(settings.volume.min, settings.volume.max) : 1
  };
  
  return params;
};

// Build filter string for video processing - simplified to core functionality
export const buildComplexFilter = (params: any, settings: VideoPresetSettings) => {
  let filter = '';
  
  // Add color adjustments if enabled
  if (settings.saturation?.enabled) {
    filter += `eq=saturation=${params.saturation}:`;
  }
  
  if (settings.contrast?.enabled) {
    filter += `contrast=${params.contrast}:`;
  }
  
  if (settings.brightness?.enabled) {
    filter += `brightness=${params.brightness}:`;
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

// Server-side processing function that connects to Railway through Supabase Edge Function
export const processVideoOnServer = async (file: File, params: any) => {
  console.log('Sending video for processing with parameters:', { params });
  
  try {
    // Create form data to send
    const formData = new FormData();
    formData.append('video', file);
    formData.append('params', JSON.stringify(params));
    
    console.log('FormData created with:', file.name, 'and params');
    
    // Making the request directly to Railway server with correct endpoint
    const response = await fetch('https://video-server-production-a86c.up.railway.app/process-video', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('Response received:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check content type first
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Try to extract text for better error reporting
      const errorText = await response.text();
      console.error('Non-JSON response received:', errorText.substring(0, 500));
      
      throw new Error(`Server returned a non-JSON response. Content type: ${contentType || 'undefined'}. Make sure you're using the correct endpoint: /process-video`);
    }
    
    // Try to parse JSON
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Failed to parse server response. The server might be experiencing issues.');
    }
    
    // Check for error status
    if (!response.ok) {
      const errorMessage = data && data.error 
        ? data.error 
        : `Error ${response.status}: Unable to process video`;
        
      console.error('Server error:', errorMessage, data);
      throw new Error(errorMessage);
    }
    
    // Handle successful response
    console.log('Processing succeeded, data:', data);
    
    // Transform Railway URLs to be accessible
    if (data.results) {
      return data.results.map(result => ({
        url: result.url.startsWith('http') ? result.url : `https://video-server-production-a86c.up.railway.app${result.url}`,
        name: result.name || `processed_${file.name}`,
        processingDetails: result.processingDetails || params
      }));
    }
    
    // Fallback for single result
    return {
      url: data.url || URL.createObjectURL(file),
      name: data.name || `processed_${file.name}`,
      processingDetails: params
    };
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
};
