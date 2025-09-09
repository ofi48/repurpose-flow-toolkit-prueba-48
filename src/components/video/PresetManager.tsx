import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Save, X, Download, Upload } from 'lucide-react';
import { VideoPresetSettings } from '@/types/preset';
import { useToast } from "@/hooks/use-toast";

interface PresetManagerProps {
  presets: VideoPresetSettings[];
  presetName: string;
  setPresetName: (name: string) => void;
  onSavePreset: () => void;
  onLoadPreset: (preset: VideoPresetSettings) => void;
  onDeletePreset: (preset: VideoPresetSettings) => void;
  onExportPresets: () => void;
  onImportPresets: (file: File) => Promise<any>;
}

const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  presetName,
  setPresetName,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onExportPresets,
  onImportPresets
}) => {
  const { toast } = useToast();

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await onImportPresets(file);
          toast({
            title: "Success",
            description: "Presets imported successfully",
            variant: "default"
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to import presets",
            variant: "destructive"
          });
        }
      }
    };
    input.click();
  };

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
              className="bg-card border-border"
            />
          </div>
          <Button onClick={onSavePreset} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Preset
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onExportPresets} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
            <Button variant="outline" onClick={handleImportClick} className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      </div>
      
      <div className="md:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Saved Presets</h2>
        <div className="space-y-2">
          {presets.length === 0 ? (
            <div className="bg-card border border-border rounded-md p-4">
              <p className="text-muted-foreground text-center">No saved presets yet</p>
            </div>
          ) : (
            presets.map((preset, index) => (
              <div key={index} className="bg-card border border-border rounded-md p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{preset.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {Object.entries(preset).filter(([key, value]) => 
                      key !== 'name' && (typeof value === 'object' ? value.enabled : value)
                    ).length} parameters enabled
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onLoadPreset(preset)}>
                    Load
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDeletePreset(preset)}>
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