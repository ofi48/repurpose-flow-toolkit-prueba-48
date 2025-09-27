import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import FileUpload from '@/components/FileUpload';
import MultiFileUpload from '@/components/video/MultiFileUpload';
import ParameterSlider from '@/components/ParameterSlider';
import ProgressBar from '@/components/ProgressBar';
import ParameterSection from '@/components/video/ParameterSection';
import ImageQueue from '@/components/image/ImageQueue';
import { ImagePresetSettings } from '@/types/preset';
import { ImageQueueItem } from '@/hooks/useImageQueue';
import { Settings, Upload, Layers } from 'lucide-react';

interface ImageProcessTabProps {
  // Single processing props
  currentFile: File | null;
  onFileSelect: (file: File) => void;
  uploadProgress: number;
  isUploading: boolean;
  numCopies: number;
  onNumCopiesChange: (value: number) => void;
  onStartProcess: () => void;
  isProcessing: boolean;
  progress: number;
  
  // Settings props
  settings: ImagePresetSettings;
  onSettingChange: (param: keyof ImagePresetSettings, subParam: 'min' | 'max' | 'enabled', value: number | boolean) => void;
  
  // Queue props
  queue: ImageQueueItem[];
  queueIsProcessing: boolean;
  currentQueueItem: string | null;
  onAddToQueue: (files: File[]) => void;
  onProcessQueue: () => void;
  onRemoveFromQueue: (id: string) => void;
  onRetryQueueItem: (id: string) => void;
  onClearQueue: () => void;
  onPreview: (fileName: string, fileUrl: string) => void;
  onDownload: (fileName: string, fileUrl: string) => void;
  onDownloadAll: () => void;
}

const ImageProcessTab: React.FC<ImageProcessTabProps> = ({
  currentFile,
  onFileSelect,
  uploadProgress,
  isUploading,
  numCopies,
  onNumCopiesChange,
  onStartProcess,
  isProcessing,
  progress,
  settings,
  onSettingChange,
  queue,
  queueIsProcessing,
  currentQueueItem,
  onAddToQueue,
  onProcessQueue,
  onRemoveFromQueue,
  onRetryQueueItem,
  onClearQueue,
  onPreview,
  onDownload,
  onDownloadAll
}) => {
  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="single">Single Processing</TabsTrigger>
        <TabsTrigger value="batch">Batch Processing</TabsTrigger>
      </TabsList>

      <TabsContent value="single" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <FileUpload 
              onFileSelect={onFileSelect}
              acceptedFileTypes=".jpg,.jpeg,.png,.webp"
              label="Upload Image"
            />
            
            {isUploading && (
              <ProgressBar value={uploadProgress} label="Uploading image..." />
            )}

            {currentFile && (
              <div className="p-4 bg-card border rounded-lg">
                <h3 className="font-medium mb-2">Selected Image</h3>
                <p className="text-sm text-muted-foreground truncate">{currentFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">Number of Variations</Label>
              <Input 
                type="number" 
                min={1} 
                max={20} 
                value={numCopies} 
                onChange={(e) => onNumCopiesChange(parseInt(e.target.value) || 3)}
                className="bg-card border-border"
              />
              
              <Button 
                className="w-full" 
                onClick={onStartProcess}
                disabled={isProcessing || !currentFile}
              >
                {isProcessing ? 'Processing...' : 'Generate Variations'}
              </Button>
              
              {isProcessing && (
                <ProgressBar value={progress} label="Processing image variations" />
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <ImageParameterControls 
              settings={settings} 
              onSettingChange={onSettingChange} 
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="batch" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <MultiFileUpload
              onFilesSelect={onAddToQueue}
              acceptedFileTypes=".jpg,.jpeg,.png,.webp"
              maxSize={20}
              label="Upload Images"
            />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Variations Per Image</Label>
              <Input 
                type="number" 
                min={1} 
                max={10} 
                value={numCopies} 
                onChange={(e) => onNumCopiesChange(parseInt(e.target.value) || 3)}
                className="bg-card border-border"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <ImageParameterControls 
              settings={settings} 
              onSettingChange={onSettingChange} 
            />
          </div>
        </div>

        <ImageQueue
          queue={queue}
          isProcessing={queueIsProcessing}
          currentItem={currentQueueItem}
          onProcessQueue={onProcessQueue}
          onRemoveItem={onRemoveFromQueue}
          onRetryItem={onRetryQueueItem}
          onClearQueue={onClearQueue}
          onPreview={onPreview}
          onDownload={onDownload}
          onDownloadAll={onDownloadAll}
        />
      </TabsContent>
    </Tabs>
  );
};

const ImageParameterControls: React.FC<{
  settings: ImagePresetSettings;
  onSettingChange: (param: keyof ImagePresetSettings, subParam: 'min' | 'max' | 'enabled', value: number | boolean) => void;
}> = ({ settings, onSettingChange }) => {
  return (
    <div className="space-y-6">
      <ParameterSection title="Image Effects" icon={<Settings />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="flip-horizontal" 
                checked={settings.flipHorizontal} 
                onCheckedChange={(checked) => onSettingChange('flipHorizontal', 'enabled', !!checked)} 
              />
              <Label htmlFor="flip-horizontal" className="text-sm font-medium">
                Flip Horizontally (Random)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="blur-border" 
                checked={settings.blurBorder} 
                onCheckedChange={(checked) => onSettingChange('blurBorder', 'enabled', !!checked)} 
              />
              <Label htmlFor="blur-border" className="text-sm font-medium">
                Apply Subtle Border Blur
              </Label>
            </div>
          </div>

          <ParameterSlider
            title="Brightness"
            min={0.7}
            max={1.3}
            step={0.05}
            minValue={settings.brightness.min}
            maxValue={settings.brightness.max}
            enabled={settings.brightness.enabled}
            onMinChange={(value) => onSettingChange('brightness', 'min', value)}
            onMaxChange={(value) => onSettingChange('brightness', 'max', value)}
            onToggle={(checked) => onSettingChange('brightness', 'enabled', checked)}
          />
          
          <ParameterSlider
            title="Contrast"
            min={0.7}
            max={1.3}
            step={0.05}
            minValue={settings.contrast.min}
            maxValue={settings.contrast.max}
            enabled={settings.contrast.enabled}
            onMinChange={(value) => onSettingChange('contrast', 'min', value)}
            onMaxChange={(value) => onSettingChange('contrast', 'max', value)}
            onToggle={(checked) => onSettingChange('contrast', 'enabled', checked)}
          />
          
          <ParameterSlider
            title="Saturation"
            min={0.7}
            max={1.3}
            step={0.05}
            minValue={settings.saturation.min}
            maxValue={settings.saturation.max}
            enabled={settings.saturation.enabled}
            onMinChange={(value) => onSettingChange('saturation', 'min', value)}
            onMaxChange={(value) => onSettingChange('saturation', 'max', value)}
            onToggle={(checked) => onSettingChange('saturation', 'enabled', checked)}
          />
          
          <ParameterSlider
            title="Compression"
            min={50}
            max={100}
            step={1}
            minValue={settings.compression.min}
            maxValue={settings.compression.max}
            enabled={settings.compression.enabled}
            onMinChange={(value) => onSettingChange('compression', 'min', value)}
            onMaxChange={(value) => onSettingChange('compression', 'max', value)}
            onToggle={(checked) => onSettingChange('compression', 'enabled', checked)}
          />
        </div>
      </ParameterSection>
    </div>
  );
};

export default ImageProcessTab;