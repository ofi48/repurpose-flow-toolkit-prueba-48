
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Save, X } from 'lucide-react';
import { VideoPresetSettings } from '@/types/preset';

interface PresetManagerProps {
  presets: { name: string; settings: VideoPresetSettings }[];
  presetName: string;
  setPresetName: (name: string) => void;
  onSavePreset: () => void;
  onLoadPreset: (index: number) => void;
  onDeletePreset: (index: number) => void;
}

const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  presetName,
  setPresetName,
  onSavePreset,
  onLoadPreset,
  onDeletePreset
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="space-y-4 md:col-span-1">
        <h2 className="text-xl font-semibold">Save Current Preset</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input 
              id="preset-name"
              placeholder="My Custom Preset" 
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="bg-app-dark-accent border-gray-700"
            />
          </div>
          <Button onClick={onSavePreset} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Preset
          </Button>
        </div>
      </div>
      
      <div className="md:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Saved Presets</h2>
        <div className="space-y-2">
          {presets.length === 0 ? (
            <div className="bg-app-dark-accent border border-gray-700 rounded-md p-4">
              <p className="text-gray-400 text-center">No saved presets yet</p>
            </div>
          ) : (
            presets.map((preset, index) => (
              <div key={index} className="bg-app-dark-accent border border-gray-700 rounded-md p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{preset.name}</h3>
                  <p className="text-sm text-gray-400">
                    {Object.entries(preset.settings).filter(([_, setting]) => 
                      typeof setting === 'object' ? setting.enabled : setting
                    ).length} parameters enabled
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onLoadPreset(index)}>
                    Load
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDeletePreset(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PresetManager;
