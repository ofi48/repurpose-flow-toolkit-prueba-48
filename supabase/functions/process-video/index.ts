
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions
interface VideoProcessingRequest {
  videoUrl: string;
  settings: {
    speed: { min: number; max: number; enabled: boolean };
    trimStart: { min: number; max: number; enabled: boolean };
    trimEnd: { min: number; max: number; enabled: boolean };
    saturation: { min: number; max: number; enabled: boolean };
    contrast: { min: number; max: number; enabled: boolean };
    brightness: { min: number; max: number; enabled: boolean };
    audioBitrate: { min: number; max: number; enabled: boolean };
    flipHorizontal: boolean;
  };
  numCopies: number;
}

interface ProcessingResult {
  name: string;
  url: string;
  processingDetails: {
    speed: number;
    saturation: number;
    contrast: number;
    brightness: number;
    flipHorizontal?: boolean;
    trimStart?: number;
    trimEnd?: number;
    audioBitrate?: number;
  };
}

// Function to generate a random value between min and max
function getRandomValue(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Function to generate a unique filename
function generateFileName(originalName: string, variant: number): string {
  const timestamp = new Date().getTime();
  const extension = originalName.split('.').pop();
  const baseName = originalName.split('/').pop()?.split('.')[0] || 'video';
  return `${baseName}_variant_${variant}_${timestamp}.${extension}`;
}

// Function to generate processing parameters based on settings
function generateProcessingParams(settings: VideoProcessingRequest['settings']): Record<string, any> {
  const processingParams: Record<string, any> = {};
  
  if (settings.speed.enabled) {
    processingParams.speed = getRandomValue(settings.speed.min, settings.speed.max);
  }
  
  if (settings.trimStart.enabled) {
    processingParams.trimStart = getRandomValue(settings.trimStart.min, settings.trimStart.max);
  }
  
  if (settings.trimEnd.enabled) {
    processingParams.trimEnd = getRandomValue(settings.trimEnd.min, settings.trimEnd.max);
  }
  
  if (settings.saturation.enabled) {
    processingParams.saturation = getRandomValue(settings.saturation.min, settings.saturation.max);
  }
  
  if (settings.contrast.enabled) {
    processingParams.contrast = getRandomValue(settings.contrast.min, settings.contrast.max);
  }
  
  if (settings.brightness.enabled) {
    processingParams.brightness = getRandomValue(settings.brightness.min, settings.brightness.max);
  }
  
  if (settings.audioBitrate.enabled) {
    processingParams.audioBitrate = Math.round(
      getRandomValue(settings.audioBitrate.min, settings.audioBitrate.max)
    );
  }
  
  if (settings.flipHorizontal) {
    processingParams.flipHorizontal = settings.flipHorizontal;
  }
  
  return processingParams;
}

// Main handler function to process the video
async function handleVideoProcessing(req: Request): Promise<Response> {
  try {
    // Extract apikey from request headers
    const apikey = req.headers.get('apikey') || '';
    
    if (!apikey) {
      throw new Error('Missing API key in request headers');
    }
    
    const { videoUrl, settings, numCopies } = await req.json() as VideoProcessingRequest;
    
    // Extract Supabase URL from the video URL
    const supabaseUrl = new URL(videoUrl).origin;
    
    console.log('Processing configuration:', {
      videoUrl: videoUrl,
      settingsEnabled: Object.entries(settings)
        .filter(([_, v]) => typeof v === 'object' && v.enabled)
        .map(([k]) => k),
      numCopies: numCopies
    });
    
    // Process video to create variations (simulation only for now)
    // In a real implementation, you would need to use a server that has FFmpeg installed
    const results: ProcessingResult[] = [];
    const originalFilename = videoUrl.split('/').pop()?.split('?')[0] || 'video.mp4';
    
    for (let i = 0; i < numCopies; i++) {
      // Generate random processing parameters based on settings
      const processingParams = generateProcessingParams(settings);
      
      // Generate output filename
      const outputFileName = generateFileName(originalFilename, i + 1);
      
      // In a real implementation, this is where you would process the video
      // Since we can't use FFmpeg WASM here, we're just simulating
      const processedVideoUrl = `${supabaseUrl}/storage/v1/object/public/videos/${outputFileName}`;
      
      // Add to results
      results.push({
        name: outputFileName,
        url: videoUrl, // Just return the original URL for now
        processingDetails: {
          speed: processingParams.speed || 1,
          saturation: processingParams.saturation || 1,
          contrast: processingParams.contrast || 1,
          brightness: processingParams.brightness || 1,
          flipHorizontal: processingParams.flipHorizontal || false,
          trimStart: processingParams.trimStart,
          trimEnd: processingParams.trimEnd,
          audioBitrate: processingParams.audioBitrate
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: "This is a simulation. To actually process videos, deploy to a server with FFmpeg installed."
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error('Error processing video:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return handleVideoProcessing(req);
});
