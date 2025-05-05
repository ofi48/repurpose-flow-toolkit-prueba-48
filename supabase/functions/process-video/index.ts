
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createFFmpeg, fetchFile } from "https://esm.sh/@ffmpeg/ffmpeg@0.11.6";

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

// Function to download a video file from URL
async function downloadVideo(url: string): Promise<Uint8Array> {
  console.log(`Downloading video from: ${url}`);
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Function to upload a processed video back to Supabase Storage
async function uploadProcessedVideo(
  videoData: Uint8Array, 
  fileName: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string> {
  console.log(`Uploading processed video: ${fileName}`);
  
  const formData = new FormData();
  const blob = new Blob([videoData], { type: 'video/mp4' });
  formData.append('file', blob, fileName);
  
  const uploadUrl = `${supabaseUrl}/storage/v1/object/videos/${fileName}`;
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: formData
  });
  
  if (!uploadResponse.ok) {
    console.error(`Upload failed: ${await uploadResponse.text()}`);
    throw new Error('Failed to upload processed video');
  }
  
  return `${supabaseUrl}/storage/v1/object/public/videos/${fileName}`;
}

// Function to build FFmpeg filters based on processing parameters
function buildFFmpegFilters(processingParams: Record<string, any>): string[] {
  const filters = [];
  
  // Apply speed effect
  if (processingParams.speed && processingParams.speed !== 1) {
    const speedFactor = 1 / processingParams.speed;
    filters.push(`setpts=${speedFactor}*PTS`);
    // Audio tempo needs to match video speed
    filters.push(`atempo=${processingParams.speed}`);
  }
  
  // Apply color adjustments
  if (processingParams.saturation && processingParams.saturation !== 1) {
    filters.push(`eq=saturation=${processingParams.saturation}`);
  }
  
  if (processingParams.contrast && processingParams.contrast !== 1) {
    filters.push(`eq=contrast=${processingParams.contrast}`);
  }
  
  if (processingParams.brightness && processingParams.brightness !== 1) {
    filters.push(`eq=brightness=${processingParams.brightness - 1}`); // FFmpeg uses -1 to 1 range for brightness
  }
  
  // Apply horizontal flip
  if (processingParams.flipHorizontal) {
    filters.push('hflip');
  }
  
  return filters;
}

// Function to build FFmpeg command based on processing parameters
function buildFFmpegCommand(processingParams: Record<string, any>, filters: string[]): string[] {
  let command = ['-i', 'input.mp4'];
  
  // Apply trim if specified
  if (processingParams.trimStart || processingParams.trimEnd) {
    let ssParam = processingParams.trimStart ? `-ss ${processingParams.trimStart}` : '';
    let toParam = processingParams.trimEnd ? `-to ${processingParams.trimEnd}` : '';
    command.push(ssParam, toParam);
  }
  
  // Add all filters to command if any
  if (filters.length > 0) {
    command.push('-vf', filters.join(','));
  }
  
  // Set audio bitrate if specified
  if (processingParams.audioBitrate) {
    command.push('-ab', `${processingParams.audioBitrate}k`);
  }
  
  // Output file configuration
  command.push('-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p');
  command.push('-y', 'output.mp4');
  
  return command;
}

// Function to apply video processing using FFmpeg WASM
async function processVideo(
  inputVideo: Uint8Array,
  processingParams: Record<string, any>,
  outputFileName: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string> {
  console.log(`Processing video with params: ${JSON.stringify(processingParams)}`);
  
  // Initialize FFmpeg
  const ffmpeg = createFFmpeg({ 
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
  });
  
  await ffmpeg.load();
  
  // Write the input file to memory
  ffmpeg.FS('writeFile', 'input.mp4', inputVideo);
  
  // Build FFmpeg filters and command
  const filters = buildFFmpegFilters(processingParams);
  const command = buildFFmpegCommand(processingParams, filters);
  
  // Run FFmpeg command
  console.log(`Running FFmpeg command: ffmpeg ${command.join(' ')}`);
  await ffmpeg.run(...command);
  
  // Read the processed file from memory
  const data = ffmpeg.FS('readFile', 'output.mp4');
  
  // Upload to Supabase Storage
  const videoUrl = await uploadProcessedVideo(data, outputFileName, supabaseUrl, supabaseKey);
  
  // Clean up
  ffmpeg.FS('unlink', 'input.mp4');
  ffmpeg.FS('unlink', 'output.mp4');
  
  return videoUrl;
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
    
    console.log(`API key present: ${apikey ? 'Yes' : 'No'}`);
    
    // Download the original video once
    const videoData = await downloadVideo(videoUrl);
    
    // Process video to create variations
    const results: ProcessingResult[] = [];
    const originalFilename = videoUrl.split('/').pop()?.split('?')[0] || 'video.mp4';
    
    for (let i = 0; i < numCopies; i++) {
      // Generate random processing parameters based on settings
      const processingParams = generateProcessingParams(settings);
      
      // Generate output filename
      const outputFileName = generateFileName(originalFilename, i + 1);
      
      // Apply processing with FFmpeg
      const processedVideoUrl = await processVideo(
        videoData, 
        processingParams, 
        outputFileName,
        supabaseUrl,
        apikey
      );
      
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
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return handleVideoProcessing(req);
});
