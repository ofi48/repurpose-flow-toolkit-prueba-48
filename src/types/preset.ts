
export interface VideoPresetSettings {
  // Video Quality
  videoBitrate: { min: number; max: number; enabled: boolean };
  audioBitrate: { min: number; max: number; enabled: boolean };
  frameRate: { min: number; max: number; enabled: boolean };
  
  // Color Adjustments
  saturation: { min: number; max: number; enabled: boolean };
  contrast: { min: number; max: number; enabled: boolean };
  brightness: { min: number; max: number; enabled: boolean };
  gamma: { min: number; max: number; enabled: boolean };
  
  // Effects
  vignette: { min: number; max: number; enabled: boolean };
  noise: { min: number; max: number; enabled: boolean };
  waveformShift: { min: number; max: number; enabled: boolean };
  pixelShift: { min: number; max: number; enabled: boolean };
  
  // Transformations
  speed: { min: number; max: number; enabled: boolean };
  zoom: { min: number; max: number; enabled: boolean };
  rotation: { min: number; max: number; enabled: boolean };
  flipHorizontal: boolean;
  
  // Size & Trim
  pixelSize: string;
  randomPixelSize: boolean;
  trimStart: { min: number; max: number; enabled: boolean };
  trimEnd: { min: number; max: number; enabled: boolean };
  
  // Special Features
  usMetadata: boolean;
  blurredBorder: { min: number; max: number; enabled: boolean };
  
  // Audio
  volume: { min: number; max: number; enabled: boolean };
  
  // Watermark
  watermark: {
    enabled: boolean;
    size: number;
    opacity: number;
    x: number;
    y: number;
  };
  
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
