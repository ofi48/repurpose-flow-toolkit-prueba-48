
export interface VideoPresetSettings {
  speed: { min: number; max: number; enabled: boolean };
  trimStart: { min: number; max: number; enabled: boolean };
  trimEnd: { min: number; max: number; enabled: boolean };
  saturation: { min: number; max: number; enabled: boolean };
  contrast: { min: number; max: number; enabled: boolean };
  brightness: { min: number; max: number; enabled: boolean };
  audioBitrate: { min: number; max: number; enabled: boolean };
  flipHorizontal: boolean;
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
