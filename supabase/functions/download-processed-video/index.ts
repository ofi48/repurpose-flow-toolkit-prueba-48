import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();
    
    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: 'Video URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Downloading video from:', videoUrl);

    // Fetch the video from Railway server
    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'video/mp4,*/*'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch video:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: `Failed to fetch video: ${response.status} ${response.statusText}` }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the video blob
    const videoBlob = await response.blob();
    
    console.log('Video downloaded successfully, size:', videoBlob.size, 'bytes');

    // Return the video with proper headers
    return new Response(videoBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'video/mp4',
        'Content-Length': videoBlob.size.toString(),
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error: any) {
    console.error('Error downloading video:', error);
    
    return new Response(
      JSON.stringify({ error: `Error downloading video: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});