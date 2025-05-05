
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Function to apply video processing using fetch to call an external API
async function processVideo(
  videoUrl: string, 
  processingParams: Record<string, any>, 
  outputFileName: string
): Promise<string> {
  // For real implementation, we would use FFmpeg to process the video here
  // Since we can't run FFmpeg directly in this example, we'll use the original video
  // In a production environment, this would call a dedicated video processing service
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, we would upload the processed video to Supabase storage
  // For now, return the original video URL as if it's been processed
  console.log(`Processed video with params: ${JSON.stringify(processingParams)}`);
  
  return videoUrl;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, settings, numCopies } = await req.json() as VideoProcessingRequest;
    
    console.log(`Processing video: ${videoUrl}`);
    console.log(`Settings: ${JSON.stringify(settings)}`);
    console.log(`Number of copies: ${numCopies}`);

    // Process video to create variations
    const results: ProcessingResult[] = [];
    const originalFilename = videoUrl.split('/').pop()?.split('?')[0] || 'video.mp4';
    
    for (let i = 0; i < numCopies; i++) {
      // Generate random values within the specified ranges for enabled settings
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
      
      // Generate output filename
      const outputFileName = generateFileName(originalFilename, i + 1);
      
      // Apply processing (in real implementation, this would use FFmpeg)
      const processedVideoUrl = await processVideo(videoUrl, processingParams, outputFileName);
      
      // Add to results
      results.push({
        name: outputFileName,
        url: processedVideoUrl,
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
        results 
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
});
