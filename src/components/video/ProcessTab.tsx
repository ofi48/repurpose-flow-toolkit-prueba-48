
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import FileUpload from '@/components/FileUpload';
import ParameterSlider from '@/components/ParameterSlider';
import ProgressBar from '@/components/ProgressBar';
import { VideoPresetSettings } from '@/types/preset';

interface ProcessTabProps {
  uploadedFile: File | null;
  uploadProgress: number;
  numCopies: number;
  setNumCopies: (value: number) => void;
  processing: boolean;
  progress: number;
  handleFileSelect: (file: File) => void;
  handleStartProcess: () => void;
  settings: VideoPresetSettings;
  updateSettingParam: (param: keyof VideoPresetSettings, subParam: 'min' | 'max' | 'enabled', value: number | boolean) => void;
}

const ProcessTab: React.FC<ProcessTabProps> = ({
  uploadedFile,
  uploadProgress,
  numCopies,
  setNumCopies,
  processing,
  progress,
  handleFileSelect,
  handleStartProcess,
  settings,
  updateSettingParam
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="space-y-6">
          <FileUpload 
            onFileSelect={handleFileSelect}
            acceptedFileTypes=".mp4,.mov,.avi,.webm"
            label="Upload Video"
          />

          {uploadProgress > 0 && uploadProgress < 100 && (
            <ProgressBar value={uploadProgress} label="Uploading video..." />
          )}

          {uploadedFile && (
            <div className="bg-app-dark-accent p-3 rounded-md">
              <p className="text-sm font-medium">Uploaded: {uploadedFile.name}</p>
              <p className="text-xs text-gray-400">
                Size: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Label className="text-sm font-medium">Number of Variants</Label>
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
              disabled={processing || !uploadedFile}
              size="lg"
            >
              {processing ? 'Processing...' : 'Start Processing'}
            </Button>
            
            {processing && (
              <ProgressBar value={progress} label="Processing video variants" />
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParameterSlider
          title="Speed"
          min={0.5}
          max={2.0}
          step={0.05}
          minValue={settings.speed.min}
          maxValue={settings.speed.max}
          enabled={settings.speed.enabled}
          onMinChange={(value) => updateSettingParam('speed', 'min', value)}
          onMaxChange={(value) => updateSettingParam('speed', 'max', value)}
          onToggle={(checked) => updateSettingParam('speed', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Trim Start"
          min={0}
          max={3}
          step={0.1}
          minValue={settings.trimStart.min}
          maxValue={settings.trimStart.max}
          enabled={settings.trimStart.enabled}
          onMinChange={(value) => updateSettingParam('trimStart', 'min', value)}
          onMaxChange={(value) => updateSettingParam('trimStart', 'max', value)}
          onToggle={(checked) => updateSettingParam('trimStart', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Trim End"
          min={0}
          max={3}
          step={0.1}
          minValue={settings.trimEnd.min}
          maxValue={settings.trimEnd.max}
          enabled={settings.trimEnd.enabled}
          onMinChange={(value) => updateSettingParam('trimEnd', 'min', value)}
          onMaxChange={(value) => updateSettingParam('trimEnd', 'max', value)}
          onToggle={(checked) => updateSettingParam('trimEnd', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Saturation"
          min={0.5}
          max={1.5}
          step={0.05}
          minValue={settings.saturation.min}
          maxValue={settings.saturation.max}
          enabled={settings.saturation.enabled}
          onMinChange={(value) => updateSettingParam('saturation', 'min', value)}
          onMaxChange={(value) => updateSettingParam('saturation', 'max', value)}
          onToggle={(checked) => updateSettingParam('saturation', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Contrast"
          min={0.5}
          max={1.5}
          step={0.05}
          minValue={settings.contrast.min}
          maxValue={settings.contrast.max}
          enabled={settings.contrast.enabled}
          onMinChange={(value) => updateSettingParam('contrast', 'min', value)}
          onMaxChange={(value) => updateSettingParam('contrast', 'max', value)}
          onToggle={(checked) => updateSettingParam('contrast', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Brightness"
          min={0.5}
          max={1.5}
          step={0.05}
          minValue={settings.brightness.min}
          maxValue={settings.brightness.max}
          enabled={settings.brightness.enabled}
          onMinChange={(value) => updateSettingParam('brightness', 'min', value)}
          onMaxChange={(value) => updateSettingParam('brightness', 'max', value)}
          onToggle={(checked) => updateSettingParam('brightness', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Audio Bitrate"
          min={64}
          max={320}
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
  );
};

export default ProcessTab;
