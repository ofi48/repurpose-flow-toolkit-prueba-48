
import { VideoPresetSettings } from '@/types/preset';

// Generate a random number between min and max with additional seed for uniqueness
export const getRandomValue = (min: number, max: number, seed?: number): number => {
  const baseSeed = seed ? (seed * 9301 + 49297) % 233280 : 0;
  const randomValue = seed ? (baseSeed / 233280) : Math.random();
  return min + randomValue * (max - min);
};

// Get values for processing parameters based on settings - respects user-configured ranges
export const generateProcessingParameters = (settings: VideoPresetSettings, variationIndex?: number) => {
  // Use timestamp and variation index to ensure uniqueness for random generation
  const seed = variationIndex !== undefined ? Date.now() + variationIndex * 1000 : undefined;
  
  // Helper function to get value based on range settings
  const getParameterValue = (setting: any, defaultValue: number, seedOffset: number = 0) => {
    if (!setting?.enabled) return defaultValue;
    
    // If min and max are the same, use that exact value (user wants specific value)
    if (setting.min === setting.max) {
      return setting.min;
    }
    
    // Otherwise generate random value within range
    return getRandomValue(setting.min, setting.max, seed ? seed + seedOffset : undefined);
  };
  
  const params = {
    // Video Quality
    videoBitrate: Math.round(getParameterValue(settings.videoBitrate, 8000, 0)),
    frameRate: Math.round(getParameterValue(settings.frameRate, 30, 1)),
    
    // Color Adjustments - Core parameters that work reliably
    saturation: getParameterValue(settings.saturation, 1, 2),
    contrast: getParameterValue(settings.contrast, 1, 3),
    brightness: getParameterValue(settings.brightness, 0, 4),
    
    // Simple Transformations
    speed: getParameterValue(settings.speed, 1, 5),
    flipHorizontal: settings.flipHorizontal || false,
    
    // Trim timing
    trimStart: getParameterValue(settings.trimStart, 0, 6),
    trimEnd: getParameterValue(settings.trimEnd, 0, 7),
    
    // Audio
    volume: getParameterValue(settings.volume, 1, 8)
  };
  
  return params;
};

// Build filter string for video processing - ensures all effects are applied correctly
export const buildComplexFilter = (params: any, settings: VideoPresetSettings) => {
  const filters: string[] = [];
  
  // Color adjustments using eq filter - build all parameters at once
  const eqParams: string[] = [];
  
  if (settings.saturation?.enabled && params.saturation !== undefined) {
    eqParams.push(`saturation=${params.saturation}`);
  }
  
  if (settings.contrast?.enabled && params.contrast !== undefined) {
    eqParams.push(`contrast=${params.contrast}`);
  }
  
  if (settings.brightness?.enabled && params.brightness !== undefined) {
    eqParams.push(`brightness=${params.brightness}`);
  }
  
  // Add eq filter if we have any color adjustments
  if (eqParams.length > 0) {
    filters.push(`eq=${eqParams.join(':')}`);
  }
  
  // Add flip filter if enabled
  if (params.flipHorizontal) {
    filters.push('hflip');
  }
  
  return filters.join(',');
};

// Server-side processing function that connects to Railway through Supabase Edge Function
export const processVideoOnServer = async (file: File, params: any, settings: VideoPresetSettings) => {
  console.log('Sending video for processing with parameters:', { params });
  
  try {
    // Build the complex filter string for FFmpeg
    const complexFilter = buildComplexFilter(params, settings);
    console.log('Built complex filter:', complexFilter);
    
    // Create enhanced parameters object with filter
    const enhancedParams = {
      ...params,
      complexFilter,
      // Ensure critical parameters are properly formatted
      videoBitrate: Math.round(params.videoBitrate || 8000),
      frameRate: Math.round(params.frameRate || 30),
      saturation: parseFloat((params.saturation || 1.0).toFixed(2)),
      contrast: parseFloat((params.contrast || 1.0).toFixed(2)),
      brightness: parseFloat((params.brightness || 0.0).toFixed(2)),
      speed: parseFloat((params.speed || 1.0).toFixed(3)),
      volume: parseFloat((params.volume || 1.0).toFixed(2))
    };
    
    // Create form data to send
    const formData = new FormData();
    formData.append('video', file);
    formData.append('params', JSON.stringify(enhancedParams));
    formData.append('settings', JSON.stringify(settings));
    
    console.log('FormData created with:', file.name, 'enhanced params:', enhancedParams);
    
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
    
    // Get the processed video URL from server
    const processedVideoUrl = data.videoUrl || data.url;
    if (!processedVideoUrl) {
      throw new Error('No processed video URL received from server');
    }
    
    // Convert HTTP to HTTPS for secure access
    const secureUrl = processedVideoUrl.replace('http://', 'https://');
    console.log('Using secure processed video URL:', secureUrl);
    
    // Return the result with the server URL directly
    return {
      url: secureUrl,
      name: `processed_${file.name}`,
      processingDetails: params
    };
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
};
