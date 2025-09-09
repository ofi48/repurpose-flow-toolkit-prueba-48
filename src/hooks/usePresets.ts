
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

  // Set initial settings when provided - only if they haven't been set yet
  useEffect(() => {
    if (initialSettings && Object.keys(settings).length === 0) {
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
      const newSettings: any = { ...prev };

      if (subParam) {
        // Ensure nested object exists before spreading
        const current = (newSettings[param] ?? {}) as any;
        newSettings[param] = {
          ...current,
          [subParam]: value,
        };
      } else {
        // For direct params like flipHorizontal
        newSettings[param] = value;
      }

      return newSettings as T;
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

  // Export presets to JSON file
  const exportPresets = () => {
    const dataStr = JSON.stringify(presets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contentwizard-presets.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  // Import presets from JSON file
  const importPresets = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedPresets = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedPresets)) {
            // Merge with existing presets, avoiding duplicates by name
            const merged = [...presets];
            importedPresets.forEach((preset: T) => {
              const existingIndex = merged.findIndex(p => p.name === preset.name);
              if (existingIndex >= 0) {
                merged[existingIndex] = preset;
              } else {
                merged.push(preset);
              }
            });
            
            setPresets(merged);
            localStorage.setItem('presets', JSON.stringify(merged));
            resolve(merged);
          } else {
            reject(new Error('Invalid preset file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
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
    exportPresets,
    importPresets,
  };
};
