
import { fetchFile } from '@ffmpeg/ffmpeg';
import { VideoPresetSettings } from '@/types/preset';

// Generate a random number between min and max
export const getRandomValue = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

// Get values for processing parameters based on settings
export const generateProcessingParameters = (settings: VideoPresetSettings) => {
  const params = {
    speed: settings.speed.enabled ? getRandomValue(settings.speed.min, settings.speed.max) : 1,
    trimStart: settings.trimStart.enabled ? getRandomValue(settings.trimStart.min, settings.trimStart.max) : 0,
    trimEnd: settings.trimEnd.enabled ? getRandomValue(settings.trimEnd.min, settings.trimEnd.max) : 0,
    saturation: settings.saturation.enabled ? getRandomValue(settings.saturation.min, settings.saturation.max) : 1,
    contrast: settings.contrast.enabled ? getRandomValue(settings.contrast.min, settings.contrast.max) : 1,
    brightness: settings.brightness.enabled ? getRandomValue(settings.brightness.min, settings.brightness.max) : 1,
    audioBitrate: settings.audioBitrate.enabled ? Math.round(getRandomValue(settings.audioBitrate.min, settings.audioBitrate.max)) : 128,
    flipHorizontal: settings.flipHorizontal
  };
  
  return params;
};

// Build FFmpeg complex filter for a video variant
export const buildComplexFilter = (params, settings: VideoPresetSettings) => {
  let filter = '';
  
  // Add saturation filter if enabled
  if (settings.saturation.enabled) {
    filter += `eq=saturation=${params.saturation}:`;
  }
  
  // Add contrast filter if enabled
  if (settings.contrast.enabled) {
    filter += `contrast=${params.contrast}:`;
  }
  
  // Add brightness filter if enabled
  if (settings.brightness.enabled) {
    filter += `brightness=${params.brightness}`;
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

// Process video with FFmpeg
export const processVideoWithFFmpeg = async (
  ffmpeg: any, 
  inputFile: File, 
  inputFileName: string, 
  outputFileName: string, 
  params: any,
  settings: VideoPresetSettings
) => {
  try {
    // Write the input file to FFmpeg's virtual file system
    ffmpeg.FS('writeFile', inputFileName, await fetchFile(inputFile));
    
    // Build the FFmpeg command
    const filterComplex = buildComplexFilter(params, settings);
    const command = ['-i', inputFileName];
    
    // Add trim parameters if enabled
    if (settings.trimStart.enabled && params.trimStart > 0) {
      command.push('-ss', `${params.trimStart}`);
    }
    
    // Add speed/tempo adjustment if enabled
    if (settings.speed.enabled && params.speed !== 1) {
      command.push('-filter:a', `atempo=${params.speed}`, '-filter:v', `setpts=1/${params.speed}*PTS`);
    }
    
    // Add video filters if any
    if (filterComplex) {
      command.push('-vf', filterComplex);
    }
    
    // Add audio bitrate if enabled
    if (settings.audioBitrate.enabled) {
      command.push('-b:a', `${params.audioBitrate}k`);
    }
    
    // Add output file name and format
    command.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22', outputFileName);
    
    console.log('FFmpeg command:', command);
    
    // Execute the command
    await ffmpeg.run(...command);
    
    // Read the result
    const data = ffmpeg.FS('readFile', outputFileName);
    
    // Create a URL for the processed video
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    
    return {
      blob,
      url: URL.createObjectURL(blob),
      name: outputFileName,
      processingDetails: params
    };
  } catch (error) {
    console.error('Error processing video with FFmpeg:', error);
    throw error;
  }
};
