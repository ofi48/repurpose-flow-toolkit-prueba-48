
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import FileUpload from '@/components/FileUpload';
import ParameterSlider from '@/components/ParameterSlider';
import ProgressBar from '@/components/ProgressBar';
import { Check, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const VideoRepurposer = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numCopies, setNumCopies] = useState(3);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Settings
  const [settings, setSettings] = useState({
    speed: { min: 0.9, max: 1.1, enabled: true },
    trimStart: { min: 0, max: 1, enabled: true },
    trimEnd: { min: 0, max: 1, enabled: false },
    brightness: { min: 0.9, max: 1.1, enabled: true },
    contrast: { min: 0.9, max: 1.1, enabled: true },
    saturation: { min: 0.9, max: 1.1, enabled: true },
    audioBitrate: { min: 96, max: 128, enabled: false }
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
    
    // Simulate processing - in a real app, this would call an API
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          
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
    param: keyof typeof settings, 
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
    </div>
  );
};

export default VideoRepurposer;
