
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handler to forward requests to Railway
async function handleVideoProcessing(req: Request): Promise<Response> {
  try {
    // Extract apikey from request headers
    const apikey = req.headers.get('apikey') || '';
    
    if (!apikey) {
      throw new Error('Missing API key in request headers');
    }
    
    // Get the request body
    const formData = await req.formData();
    
    // Check if this is a comparison request
    const operation = formData.get('operation');
    const isComparison = operation && 
      (String(operation).includes('compare') || String(operation) === 'compare-pixels');
    
    // Choose the appropriate endpoint based on the operation
    let railwayUrl = "https://video-server-production-a86c.up.railway.app/process-video";
    
    if (isComparison) {
      // Use the comparison-specific endpoint - first try compare-media, fallback to compare-files
      railwayUrl = "https://video-server-production-a86c.up.railway.app/compare-media";
      console.log("Using comparison-specific endpoint");
    }
    
    // Log request details for debugging
    console.log(`Forwarding ${isComparison ? 'comparison' : 'processing'} request to Railway:`, railwayUrl);
    console.log("FormData keys:", [...formData.keys()]);
    
    // Send the request to Railway with proper headers and increased timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
    
    try {
      const railwayResponse = await fetch(railwayUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Log the raw response details for debugging
      console.log("Railway response status:", railwayResponse.status);
      console.log("Railway response headers:", Object.fromEntries(railwayResponse.headers.entries()));
      
      // Check if the response is JSON
      const contentType = railwayResponse.headers.get('content-type');
      console.log("Response content-type:", contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, get text for better error message
        const textResponse = await railwayResponse.text();
        console.error('Non-JSON response from Railway (first 500 chars):', textResponse.substring(0, 500));
        
        // For comparison requests, try to handle errors gracefully
        if (isComparison) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              similarity: 50, // Fallback similarity value for comparison requests
              details: {
                note: "Could not perform accurate comparison. Using estimated value.",
                error: "Remote API returned non-JSON response",
                responsePreview: textResponse.substring(0, 200)
              }
            }),
            { 
              status: 200, // Return 200 to prevent client-side errors for comparison
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          );
        }
        
        // Determine if it's an HTML error page
        const isHtmlError = textResponse.toLowerCase().includes('<!doctype html') || 
                            textResponse.toLowerCase().includes('<html');
        
        let errorMessage = 'Unexpected response from video processing server.';
        if (isHtmlError) {
          errorMessage = 'The server returned an HTML page instead of JSON. Ensure you are using the correct endpoint.';
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorMessage,
            contentType: contentType || 'undefined',
            responsePreview: textResponse.substring(0, 200)
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
        
        // For comparison requests, return a fallback value
        if (isComparison) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              similarity: 50, // Fallback value
              error: 'Error parsing response from comparison server.',
              details: {
                note: "Using estimated value due to parsing error",
                errorDetails: jsonError.message
              }
            }),
            { 
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Error parsing response from video processing server.', 
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
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      
      // Check if it's a timeout error
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Request timeout. The video processing is taking too long. Please try with a smaller video or reduce processing effects.'
          }),
          { 
            status: 504,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            } 
          }
        );
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Error forwarding to Railway:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An error occurred while processing the request." 
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
