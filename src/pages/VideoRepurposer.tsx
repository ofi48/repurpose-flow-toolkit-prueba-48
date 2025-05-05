
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from '@/components/FileUpload';
import ParameterSlider from '@/components/ParameterSlider';
import ProgressBar from '@/components/ProgressBar';
import { Check, Download, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { VideoPresetSettings } from '@/types/preset';

const VideoRepurposer = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numCopies, setNumCopies] = useState(3);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("settings");
  const [videoResults, setVideoResults] = useState<Array<{ name: string, url: string }>>([]);
  const [presets, setPresets] = useState<VideoPresetSettings[]>([]);
  const [presetName, setPresetName] = useState('');
  const { toast } = useToast();

  // Settings
  const [settings, setSettings] = useState<VideoPresetSettings>({
    speed: { min: 0.9, max: 1.1, enabled: true },
    trimStart: { min: 0, max: 1, enabled: true },
    trimEnd: { min: 0, max: 1, enabled: false },
    brightness: { min: 0.9, max: 1.1, enabled: true },
    contrast: { min: 0.9, max: 1.1, enabled: true },
    saturation: { min: 0.9, max: 1.1, enabled: true },
    audioBitrate: { min: 96, max: 128, enabled: false },
    flipHorizontal: false
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleStartProcess = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a video to continue.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setVideoResults([]);
    
    // Simulate processing - in a real app, this would call an API
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          
          // Generate mock results
          const results = Array.from({ length: numCopies }, (_, i) => ({
            name: `Variant ${i + 1}`,
            url: URL.createObjectURL(selectedFile)
          }));
          
          setVideoResults(results);
          setActiveTab('results');
          
          toast({
            title: "Processing complete",
            description: `Generated ${numCopies} video variants.`,
            variant: "default"
          });
          
          return 100;
        }
        return prev + (100 / (numCopies * 10));
      });
    }, 300);
  };

  const updateSettingParam = (
    param: keyof VideoPresetSettings, 
    subParam: 'min' | 'max' | 'enabled', 
    value: number | boolean
  ) => {
    setSettings(prev => {
      // Create a properly typed update
      return {
        ...prev,
        [param]: {
          ...prev[param],
          [subParam]: value
        }
      };
    });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Missing Preset Name",
        description: "Please provide a name for your preset.",
        variant: "destructive"
      });
      return;
    }
    
    const newPreset = {
      ...settings,
      name: presetName
    };
    
    setPresets([...presets, newPreset]);
    setPresetName('');
    
    toast({
      title: "Preset Saved",
      description: `Preset "${presetName}" has been saved.`,
      variant: "default"
    });
  };
  
  const handleLoadPreset = (preset: VideoPresetSettings) => {
    setSettings(preset);
    toast({
      title: "Preset Loaded",
      description: `Preset "${preset.name}" has been loaded.`,
      variant: "default"
    });
  };

  const handleDownloadResult = (videoUrl: string, name: string) => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${name}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeletePreset = (presetName: string) => {
    setPresets(presets.filter(preset => preset.name !== presetName));
    toast({
      title: "Preset Deleted",
      description: `Preset "${presetName}" has been removed.`,
      variant: "default"
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Video Repurposer</h1>
          <p className="text-gray-400 mt-1">
            Create multiple randomized versions of your videos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-6 bg-app-dark-accent">
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          <TabsTrigger value="results" className="flex-1">Results</TabsTrigger>
          <TabsTrigger value="presets" className="flex-1">Presets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <FileUpload 
                onFileSelect={handleFileSelect}
                acceptedFileTypes=".mp4,.mov,.avi,.webm"
                label="Upload Video"
              />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Number of Copies</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={20} 
                  value={numCopies} 
                  onChange={(e) => setNumCopies(parseInt(e.target.value) || 3)}
                  className="bg-app-dark-accent border-gray-700"
                />
                
                <Button 
                  className="w-full" 
                  onClick={handleStartProcess}
                  disabled={processing || !selectedFile}
                >
                  {processing ? 'Processing...' : 'Generate Variants'}
                </Button>
                
                {processing && (
                  <ProgressBar value={progress} label="Processing video variants" />
                )}

                <div className="pt-4 space-y-3">
                  <Label className="text-sm font-medium">Save Current Settings as Preset</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Preset name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="bg-app-dark-accent border-gray-700"
                    />
                    <Button 
                      onClick={handleSavePreset}
                      disabled={!presetName.trim()}
                      className="whitespace-nowrap"
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ParameterSlider
                  title="Speed"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  minValue={settings.speed.min}
                  maxValue={settings.speed.max}
                  enabled={settings.speed.enabled}
                  onMinChange={(value) => updateSettingParam('speed', 'min', value)}
                  onMaxChange={(value) => updateSettingParam('speed', 'max', value)}
                  onToggle={(checked) => updateSettingParam('speed', 'enabled', checked)}
                />
                
                <ParameterSlider
                  title="Trim Start (seconds)"
                  min={0}
                  max={5}
                  step={0.1}
                  minValue={settings.trimStart.min}
                  maxValue={settings.trimStart.max}
                  enabled={settings.trimStart.enabled}
                  onMinChange={(value) => updateSettingParam('trimStart', 'min', value)}
                  onMaxChange={(value) => updateSettingParam('trimStart', 'max', value)}
                  onToggle={(checked) => updateSettingParam('trimStart', 'enabled', checked)}
                />
                
                <ParameterSlider
                  title="Trim End (seconds)"
                  min={0}
                  max={5}
                  step={0.1}
                  minValue={settings.trimEnd.min}
                  maxValue={settings.trimEnd.max}
                  enabled={settings.trimEnd.enabled}
                  onMinChange={(value) => updateSettingParam('trimEnd', 'min', value)}
                  onMaxChange={(value) => updateSettingParam('trimEnd', 'max', value)}
                  onToggle={(checked) => updateSettingParam('trimEnd', 'enabled', checked)}
                />
                
                <ParameterSlider
                  title="Brightness"
                  min={0.7}
                  max={1.3}
                  step={0.05}
                  minValue={settings.brightness.min}
                  maxValue={settings.brightness.max}
                  enabled={settings.brightness.enabled}
                  onMinChange={(value) => updateSettingParam('brightness', 'min', value)}
                  onMaxChange={(value) => updateSettingParam('brightness', 'max', value)}
                  onToggle={(checked) => updateSettingParam('brightness', 'enabled', checked)}
                />
                
                <ParameterSlider
                  title="Contrast"
                  min={0.7}
                  max={1.3}
                  step={0.05}
                  minValue={settings.contrast.min}
                  maxValue={settings.contrast.max}
                  enabled={settings.contrast.enabled}
                  onMinChange={(value) => updateSettingParam('contrast', 'min', value)}
                  onMaxChange={(value) => updateSettingParam('contrast', 'max', value)}
                  onToggle={(checked) => updateSettingParam('contrast', 'enabled', checked)}
                />
                
                <ParameterSlider
                  title="Saturation"
                  min={0.7}
                  max={1.3}
                  step={0.05}
                  minValue={settings.saturation.min}
                  maxValue={settings.saturation.max}
                  enabled={settings.saturation.enabled}
                  onMinChange={(value) => updateSettingParam('saturation', 'min', value)}
                  onMaxChange={(value) => updateSettingParam('saturation', 'max', value)}
                  onToggle={(checked) => updateSettingParam('saturation', 'enabled', checked)}
                />
                
                <ParameterSlider
                  title="Audio Bitrate (kbps)"
                  min={64}
                  max={192}
                  step={8}
                  minValue={settings.audioBitrate.min}
                  maxValue={settings.audioBitrate.max}
                  enabled={settings.audioBitrate.enabled}
                  onMinChange={(value) => updateSettingParam('audioBitrate', 'min', value)}
                  onMaxChange={(value) => updateSettingParam('audioBitrate', 'max', value)}
                  onToggle={(checked) => updateSettingParam('audioBitrate', 'enabled', checked)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="results">
          <div className="space-y-6">
            {videoResults.length === 0 ? (
              <div className="text-center py-10 bg-app-dark-accent rounded-lg">
                <p className="text-gray-400">No results yet. Generate video variants to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoResults.map((result, index) => (
                  <div key={index} className="bg-app-dark-accent p-4 rounded-lg space-y-3">
                    <h3 className="font-medium">{result.name}</h3>
                    <video 
                      src={result.url} 
                      controls 
                      className="w-full rounded-md bg-black"
                    ></video>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDownloadResult(result.url, result.name)}
                    >
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="presets">
          <div className="space-y-6">
            {presets.length === 0 ? (
              <div className="text-center py-10 bg-app-dark-accent rounded-lg">
                <p className="text-gray-400">No presets saved. Save current settings as a preset to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presets.map((preset, index) => (
                  <div key={index} className="bg-app-dark-accent p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{preset.name}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                        onClick={() => handleDeletePreset(preset.name || '')}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>Speed: {preset.speed.enabled ? `${preset.speed.min} - ${preset.speed.max}` : 'Disabled'}</p>
                      <p>Brightness: {preset.brightness.enabled ? `${preset.brightness.min} - ${preset.brightness.max}` : 'Disabled'}</p>
                      <p>Contrast: {preset.contrast.enabled ? `${preset.contrast.min} - ${preset.contrast.max}` : 'Disabled'}</p>
                      <p>Saturation: {preset.saturation.enabled ? `${preset.saturation.min} - ${preset.saturation.max}` : 'Disabled'}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      Load Preset
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoRepurposer;
