
import { useState, useEffect } from 'react';
import { VideoPresetSettings, ImagePresetSettings, GifSettings } from '@/types/preset';

// Default image settings
const defaultImageSettings: ImagePresetSettings = {
  flipHorizontal: false,
  brightness: { min: 0.9, max: 1.1, enabled: true },
  contrast: { min: 0.9, max: 1.1, enabled: true },
  saturation: { min: 0.9, max: 1.1, enabled: true },
  blurBorder: false,
  compression: { min: 70, max: 90, enabled: true },
};

// Default GIF settings
const defaultGifSettings: GifSettings = {
  frameRate: 10,
  width: 320,
  quality: 10,
};

export const usePresets = <T extends VideoPresetSettings | ImagePresetSettings | GifSettings>(
  initialSettings?: T
) => {
  const [settings, setSettings] = useState<T>(() => {
    // Ensure we always have valid initial settings
    return initialSettings || {} as T;
  });
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<T[]>([]);

  // Set initial settings when provided
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  // Load presets from localStorage on initial render
  useEffect(() => {
    const savedPresetsString = localStorage.getItem('presets');
    
    if (savedPresetsString) {
      try {
        const savedPresets = JSON.parse(savedPresetsString);
        setPresets(Array.isArray(savedPresets) ? savedPresets : []);
      } catch (e) {
        console.error('Error parsing saved presets:', e);
        setPresets([]);
      }
    }
  }, []);

  // Generic method to update a setting parameter
  const updateSettingParam = (param: keyof T, subParam: string, value: any) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      
      if (subParam) {
        // For nested params like { min, max, enabled }
        newSettings[param] = {
          ...newSettings[param],
          [subParam]: value,
        };
      } else {
        // For direct params like flipHorizontal
        newSettings[param] = value;
      }
      
      return newSettings;
    });
  };

  // Save a preset
  const savePreset = () => {
    if (!presetName) return;
    
    // Create new preset with settings and name
    const newPreset = {
      ...settings,
      name: presetName,
    } as T;
    
    // Add to presets
    const updatedPresets = [...presets.filter(p => p.name !== presetName), newPreset];
    setPresets(updatedPresets);
    
    // Save to localStorage
    localStorage.setItem('presets', JSON.stringify(updatedPresets));
    
    return newPreset;
  };

  // Load a preset
  const loadPreset = (presetToLoad: T) => {
    setSettings(presetToLoad);
    setPresetName(presetToLoad.name || '');
  };

  // Delete a preset
  const deletePreset = (presetToDelete: T) => {
    const updatedPresets = presets.filter(p => p.name !== presetToDelete.name);
    setPresets(updatedPresets);
    localStorage.setItem('presets', JSON.stringify(updatedPresets));
  };

  return {
    settings,
    setSettings,
    presetName,
    setPresetName,
    presets,
    updateSettingParam,
    savePreset,
    loadPreset,
    deletePreset,
  };
};
