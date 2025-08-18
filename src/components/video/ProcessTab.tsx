
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import FileUpload from '@/components/FileUpload';
import MultiFileUpload from './MultiFileUpload';
import VideoQueue from './VideoQueue';
import ProgressBar from '@/components/ProgressBar';
import { VideoPresetSettings } from '@/types/preset';
import VideoProcessingPanel from './VideoProcessingPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueueItem } from '@/hooks/useVideoQueue';

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
  // Queue props
  queue: QueueItem[];
  isQueueProcessing: boolean;
  currentQueueItem: string | null;
  onFilesSelect: (files: File[]) => void;
  onProcessQueue: () => void;
  onRemoveFromQueue: (id: string) => void;
  onRetryQueueItem: (id: string) => void;
  onClearQueue: () => void;
  onPreviewQueueItem?: (fileName: string, fileUrl: string) => void;
  onDownloadQueueItem?: (fileName: string, fileUrl: string) => void;
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
  updateWatermarkParam,
  // Queue props
  queue,
  isQueueProcessing,
  currentQueueItem,
  onFilesSelect,
  onProcessQueue,
  onRemoveFromQueue,
  onRetryQueueItem,
  onClearQueue,
  onPreviewQueueItem,
  onDownloadQueueItem
}) => {
  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="single">Single Processing</TabsTrigger>
        <TabsTrigger value="queue">Batch Processing</TabsTrigger>
      </TabsList>

      <TabsContent value="single" className="space-y-6">
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
                <div className="bg-card border p-3 rounded-md">
                  <p className="text-sm font-medium">Uploaded: {uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-sm font-medium">Number of Variations</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={20} 
                  value={numCopies} 
                  onChange={(e) => setNumCopies(parseInt(e.target.value) || 3)}
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
                  <ProgressBar value={progress} label="Processing video variations" />
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="w-full">
              <VideoProcessingPanel 
                settings={settings} 
                updateSettingParam={updateSettingParam}
                updateWatermarkParam={updateWatermarkParam}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="queue" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <MultiFileUpload
              onFilesSelect={onFilesSelect}
              acceptedFileTypes=".mp4,.mov,.avi,.webm"
              label="Upload Videos to Queue"
            />

            <div className="space-y-4">
              <Label className="text-sm font-medium">Number of Variations per Video</Label>
              <Input 
                type="number" 
                min={1} 
                max={20} 
                value={numCopies} 
                onChange={(e) => setNumCopies(parseInt(e.target.value) || 3)}
              />
            </div>

            <VideoProcessingPanel 
              settings={settings} 
              updateSettingParam={updateSettingParam}
              updateWatermarkParam={updateWatermarkParam}
            />
          </div>

          <div>
            <VideoQueue
              queue={queue}
              isProcessing={isQueueProcessing}
              currentItem={currentQueueItem}
              onProcessQueue={onProcessQueue}
              onRemoveItem={onRemoveFromQueue}
              onRetryItem={onRetryQueueItem}
              onClearQueue={onClearQueue}
              onPreview={onPreviewQueueItem}
              onDownload={onDownloadQueueItem}
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ProcessTab;
