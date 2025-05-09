
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import FileUpload from '@/components/FileUpload';
import ProgressBar from '@/components/ProgressBar';
import { VideoPresetSettings } from '@/types/preset';
import VideoProcessingPanel from './VideoProcessingPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  updateSettingParam: (param: keyof VideoPresetSettings, subParam: string, value: any) => void;
  updateWatermarkParam: (param: string, value: any) => void;
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
  updateSettingParam,
  updateWatermarkParam
}) => {
  return (
    <div className="space-y-6">
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

        <div className="lg:col-span-2">
          <Tabs defaultValue="video-quality" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="video-quality">Quality</TabsTrigger>
              <TabsTrigger value="color">Color</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="video-quality" className="space-y-4">
              <VideoProcessingPanel 
                settings={settings} 
                updateSettingParam={updateSettingParam}
                updateWatermarkParam={updateWatermarkParam}
              />
            </TabsContent>
            
            <TabsContent value="color" className="space-y-4">
              <VideoProcessingPanel 
                settings={settings} 
                updateSettingParam={updateSettingParam}
                updateWatermarkParam={updateWatermarkParam}
              />
            </TabsContent>
            
            <TabsContent value="effects" className="space-y-4">
              <VideoProcessingPanel 
                settings={settings} 
                updateSettingParam={updateSettingParam}
                updateWatermarkParam={updateWatermarkParam}
              />
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <VideoProcessingPanel 
                settings={settings} 
                updateSettingParam={updateSettingParam}
                updateWatermarkParam={updateWatermarkParam}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProcessTab;
