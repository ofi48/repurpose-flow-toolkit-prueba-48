
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

    // In a real implementation, we would use FFmpeg here to process the video
    // For now, we'll simulate the processing by waiting and returning mocked results
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock results with real URLs
    const results = [];
    
    for (let i = 0; i < numCopies; i++) {
      // Extract original filename from URL
      const originalFilename = videoUrl.split('/').pop()?.split('?')[0] || 'video.mp4';
      const baseName = originalFilename.split('.')[0];
      const extension = originalFilename.split('.').pop();
      
      // In a real implementation, this would be a new processed video URL
      // For now, we're just returning the original URL since we can't do real processing
      results.push({
        name: `${baseName}_variant_${i+1}.${extension}`,
        url: videoUrl, // Use original URL (in real app, would be new processed URL)
        processingDetails: {
          speed: settings.speed.enabled ? 
            Math.random() * (settings.speed.max - settings.speed.min) + settings.speed.min : 1,
          saturation: settings.saturation.enabled ? 
            Math.random() * (settings.saturation.max - settings.saturation.min) + settings.saturation.min : 1,
          contrast: settings.contrast.enabled ? 
            Math.random() * (settings.contrast.max - settings.contrast.min) + settings.contrast.min : 1,
          brightness: settings.brightness.enabled ? 
            Math.random() * (settings.brightness.max - settings.brightness.min) + settings.brightness.min : 1
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
