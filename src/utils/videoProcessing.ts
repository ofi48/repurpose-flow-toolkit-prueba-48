
import { VideoPresetSettings } from '@/types/preset';

// Generate a random number between min and max
export const getRandomValue = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

// Get values for processing parameters based on settings
export const generateProcessingParameters = (settings: VideoPresetSettings) => {
  const params = {
    // Video Quality
    videoBitrate: settings.videoBitrate?.enabled ? Math.round(getRandomValue(settings.videoBitrate.min, settings.videoBitrate.max)) : 8000,
    audioBitrate: settings.audioBitrate?.enabled ? Math.round(getRandomValue(settings.audioBitrate.min, settings.audioBitrate.max)) : 128,
    frameRate: settings.frameRate?.enabled ? Math.round(getRandomValue(settings.frameRate.min, settings.frameRate.max)) : 30,
    
    // Color Adjustments
    saturation: settings.saturation?.enabled ? getRandomValue(settings.saturation.min, settings.saturation.max) : 1,
    contrast: settings.contrast?.enabled ? getRandomValue(settings.contrast.min, settings.contrast.max) : 1,
    brightness: settings.brightness?.enabled ? getRandomValue(settings.brightness.min, settings.brightness.max) : 0,
    gamma: settings.gamma?.enabled ? getRandomValue(settings.gamma.min, settings.gamma.max) : 1,
    
    // Effects
    vignette: settings.vignette?.enabled ? getRandomValue(settings.vignette.min, settings.vignette.max) : 0,
    noise: settings.noise?.enabled ? getRandomValue(settings.noise.min, settings.noise.max) : 0,
    waveformShift: settings.waveformShift?.enabled ? getRandomValue(settings.waveformShift.min, settings.waveformShift.max) : 0,
    pixelShift: settings.pixelShift?.enabled ? getRandomValue(settings.pixelShift.min, settings.pixelShift.max) : 0,
    
    // Transformations
    speed: settings.speed?.enabled ? getRandomValue(settings.speed.min, settings.speed.max) : 1,
    zoom: settings.zoom?.enabled ? getRandomValue(settings.zoom.min, settings.zoom.max) : 1,
    rotation: settings.rotation?.enabled ? getRandomValue(settings.rotation.min, settings.rotation.max) : 0,
    flipHorizontal: settings.flipHorizontal || false,
    
    // Size & Trim
    pixelSize: settings.pixelSize || "",
    randomPixelSize: settings.randomPixelSize || false,
    trimStart: settings.trimStart?.enabled ? getRandomValue(settings.trimStart.min, settings.trimStart.max) : 0,
    trimEnd: settings.trimEnd?.enabled ? getRandomValue(settings.trimEnd.min, settings.trimEnd.max) : 0,
    
    // Special Features
    usMetadata: settings.usMetadata || false,
    blurredBorder: settings.blurredBorder?.enabled ? 
      {
        min: settings.blurredBorder.min,
        max: settings.blurredBorder.max
      } : null,
    
    // Audio
    volume: settings.volume?.enabled ? getRandomValue(settings.volume.min, settings.volume.max) : 1,
    
    // Watermark
    watermark: settings.watermark?.enabled ? {
      size: settings.watermark.size,
      opacity: settings.watermark.opacity,
      x: settings.watermark.x,
      y: settings.watermark.y
    } : null
  };
  
  return params;
};

// Build filter string for video processing (for API reference)
export const buildComplexFilter = (params: any, settings: VideoPresetSettings) => {
  let filter = '';
  
  // Add saturation filter if enabled
  if (settings.saturation?.enabled) {
    filter += `eq=saturation=${params.saturation}:`;
  }
  
  // Add contrast filter if enabled
  if (settings.contrast?.enabled) {
    filter += `contrast=${params.contrast}:`;
  }
  
  // Add brightness filter if enabled
  if (settings.brightness?.enabled) {
    filter += `brightness=${params.brightness}:`;
  }
  
  // Add gamma filter if enabled
  if (settings.gamma?.enabled) {
    filter += `gamma=${params.gamma}:`;
  }
  
  // Remove trailing colon if present
  if (filter.endsWith(':')) {
    filter = filter.slice(0, -1);
  }
  
  // Add vignette filter if enabled
  if (settings.vignette?.enabled && params.vignette > 0) {
    filter = filter ? `${filter},vignette=angle=PI/4:opacity=${params.vignette}` : `vignette=angle=PI/4:opacity=${params.vignette}`;
  }
  
  // Add flip filter if enabled
  if (params.flipHorizontal) {
    filter = filter ? `${filter},hflip` : 'hflip';
  }
  
  // Add rotation filter if enabled
  if (settings.rotation?.enabled && params.rotation !== 0) {
    filter = filter ? `${filter},rotate=${params.rotation}*PI/180` : `rotate=${params.rotation}*PI/180`;
  }
  
  // Add zoom filter if enabled
  if (settings.zoom?.enabled && params.zoom !== 1) {
    filter = filter ? `${filter},scale=iw*${params.zoom}:ih*${params.zoom}` : `scale=iw*${params.zoom}:ih*${params.zoom}`;
  }
  
  // Add noise filter if enabled
  if (settings.noise?.enabled && params.noise > 0) {
    filter = filter ? `${filter},noise=alls=${params.noise}:allf=t` : `noise=alls=${params.noise}:allf=t`;
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
    const response = await fetch('https://video-server-production-d7af.up.railway.app/process-video', {
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
        url: result.url.startsWith('http') ? result.url : `https://video-server-production-d7af.up.railway.app${result.url}`,
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
