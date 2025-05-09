
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handler to forward requests to Railway
async function handleFileComparison(req: Request): Promise<Response> {
  try {
    // Extract apikey from request headers
    const apikey = req.headers.get('apikey') || '';
    
    if (!apikey) {
      throw new Error('Missing API key in request headers');
    }
    
    // Get the request body
    const formData = await req.formData();
    
    // Add a parameter to indicate this is a pixel comparison request
    formData.append('operation', 'compare-pixels');
    
    // Forward the request to Railway - use the main endpoint instead of /compare-pixels
    const railwayUrl = "https://video-server-production-d7af.up.railway.app/process-video";
    
    // Log request details for debugging
    console.log("Forwarding pixel comparison request to Railway:", railwayUrl);
    console.log("FormData keys:", [...formData.keys()]);
    
    // Send the request to Railway with proper headers
    const railwayResponse = await fetch(railwayUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    // Log the raw response details for debugging
    console.log("Railway comparison response status:", railwayResponse.status);
    console.log("Railway comparison response headers:", Object.fromEntries(railwayResponse.headers.entries()));
    
    // Check if the response is JSON
    const contentType = railwayResponse.headers.get('content-type');
    console.log("Response content-type:", contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, get text for better error message
      const textResponse = await railwayResponse.text();
      console.error('Non-JSON response from Railway (first 500 chars):', textResponse.substring(0, 500));
      
      // Return a more detailed error message but make it user-friendly
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'The server returned an unexpected response format. Please try again later.',
          details: 'Remote API returned non-JSON response. This is likely a configuration issue on the backend.'
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
    
    // Get the JSON response from Railway
    let railwayData;
    try {
      railwayData = await railwayResponse.json();
      console.log("Railway data received:", JSON.stringify(railwayData).substring(0, 200));
      
      // If we received valid pixel similarity data
      if (railwayData.pixelSimilarity !== undefined) {
        return new Response(
          JSON.stringify({
            success: true,
            similarity: railwayData.pixelSimilarity,
            details: railwayData.details || {}
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            },
            status: 200
          }
        );
      }
      
      // If we have a different successful response
      return new Response(
        JSON.stringify(railwayData),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          status: railwayResponse.status
        }
      );
    } catch (jsonError) {
      console.error('Error parsing Railway JSON response:', jsonError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error parsing response from pixel comparison server.', 
          details: jsonError.message 
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
  } catch (error) {
    console.error('Error forwarding to Railway:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An error occurred while comparing files pixel by pixel.",
        fallback: true
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

  return handleFileComparison(req);
});

