import { useState } from 'react';
import { VideoPresetSettings } from '@/types/preset';
import { useToast } from "@/hooks/use-toast";

const defaultSettings: VideoPresetSettings = {
  speed: { min: 0.9, max: 1.1, enabled: true },
  trimStart: { min: 0, max: 0.5, enabled: true },
  trimEnd: { min: 0, max: 0.5, enabled: false },
  saturation: { min: 0.9, max: 1.1, enabled: true },
  contrast: { min: 0.9, max: 1.1, enabled: true },
  brightness: { min: 0.9, max: 1.1, enabled: true },
  audioBitrate: { min: 96, max: 128, enabled: false },
  flipHorizontal: false
};

export const usePresets = () => {
  const [settings, setSettings] = useState<VideoPresetSettings>(defaultSettings);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<{name: string, settings: VideoPresetSettings}[]>([]);
  const { toast } = useToast();

  const updateSettingParam = (
    param: keyof VideoPresetSettings, 
    subParam: 'min' | 'max' | 'enabled', 
    value: number | boolean
  ) => {
    setSettings(prev => {
      // Ensure we're dealing with a valid object before spreading
      const paramValue = prev[param];
      if (typeof paramValue === 'object' && paramValue !== null) {
        return {
          ...prev,
          [param]: {
            ...paramValue,
            [subParam]: value
          }
        };
      }
      
      // Handle the case where the parameter is not an object (like flipHorizontal)
      if (subParam === 'enabled' && typeof paramValue === 'boolean') {
        return {
          ...prev,
          [param]: value
        };
      }
      
      // Return unchanged if we can't update
      return prev;
    });
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Preset name required",
        description: "Please enter a name for your preset.",
        variant: "destructive"
      });
      return;
    }

    // Check if preset name already exists
    if (presets.some(preset => preset.name === presetName)) {
      toast({
        title: "Preset name already exists",
        description: "Please choose a different name for your preset.",
        variant: "destructive"
      });
      return;
    }

    // Save preset
    const newPreset = {
      name: presetName,
      settings: {...settings}
    };
    
    setPresets([...presets, newPreset]);
    
    toast({
      title: "Preset saved",
      description: `"${presetName}" preset has been saved.`,
      variant: "default"
    });
    
    setPresetName("");
  };

  const loadPreset = (presetIndex: number) => {
    const selectedPreset = presets[presetIndex];
    setSettings(selectedPreset.settings);
    
    toast({
      title: "Preset loaded",
      description: `"${selectedPreset.name}" preset has been loaded.`,
      variant: "default"
    });
  };

  const deletePreset = (presetIndex: number) => {
    const updatedPresets = [...presets];
    updatedPresets.splice(presetIndex, 1);
    setPresets(updatedPresets);
    
    toast({
      title: "Preset deleted",
      description: "Preset has been removed.",
      variant: "default"
    });
  };

  return {
    settings,
    presetName,
    presets,
    setPresetName,
    updateSettingParam,
    savePreset,
    loadPreset,
    deletePreset
  };
};
