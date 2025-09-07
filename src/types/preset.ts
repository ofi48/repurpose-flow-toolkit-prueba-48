
export interface VideoPresetSettings {
  // Video Quality - Core parameters that actually work
  videoBitrate: { min: number; max: number; enabled: boolean };
  frameRate: { min: number; max: number; enabled: boolean };
  
  // Color Adjustments - Proven effective
  saturation: { min: number; max: number; enabled: boolean };
  contrast: { min: number; max: number; enabled: boolean };
  brightness: { min: number; max: number; enabled: boolean };
  
  // Simple Transformations
  speed: { min: number; max: number; enabled: boolean };
  flipHorizontal: boolean;
  
  // Trim timing
  trimStart: { min: number; max: number; enabled: boolean };
  trimEnd: { min: number; max: number; enabled: boolean };
  
  // Audio
  volume: { min: number; max: number; enabled: boolean };
  
  name?: string;
}

export interface ImagePresetSettings {
  flipHorizontal: boolean;
  brightness: { min: number; max: number; enabled: boolean };
  contrast: { min: number; max: number; enabled: boolean };
  saturation: { min: number; max: number; enabled: boolean };
  blurBorder: boolean;
  compression: { min: number; max: number; enabled: boolean };
  name?: string;
}

export interface GifSettings {
  frameRate: number;
  width: number;
  quality: number;
  name?: string;
}
