import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { useVideoQueue } from '@/hooks/useVideoQueue';
import { usePresets } from '@/hooks/usePresets';

// Import refactored components
import ProcessTab from '@/components/video/ProcessTab';
import PresetManager from '@/components/video/PresetManager';
import ResultsTab from '@/components/video/ResultsTab';
import VideoPreview from '@/components/video/VideoPreview';

const VideoRepurposer = () => {
  const [activeTab, setActiveTab] = useState("process");
  const [numCopies, setNumCopies] = useState(3);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreview, setCurrentPreview] = useState("");
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState("");
  const { toast } = useToast();

  // Custom hooks
  const {
    uploadedFile,
    uploadedFileUrl,
    processing,
    progress,
    results,
    uploadProgress,
    ffmpegLoaded,
    handleFileSelect,
    processVideo,
    setResults
  } = useVideoProcessing();

  // Video queue hook
  const {
    queue,
    isProcessing: isQueueProcessing,
    currentItem: currentQueueItem,
    addVideosToQueue,
    removeFromQueue,
    clearQueue,
    retryItem,
    processQueue
  } = useVideoQueue();

  // Extended default settings for the new parameters
  const defaultSettings = {
    // Video Quality
    videoBitrate: { min: 3000, max: 8000, enabled: true },
    audioBitrate: { min: 128, max: 192, enabled: false },
    frameRate: { min: 30, max: 30, enabled: false },
    
    // Color Adjustments
    saturation: { min: 0.9, max: 1.1, enabled: true },
    contrast: { min: 0.9, max: 1.1, enabled: true },
    brightness: { min: -0.1, max: 0.1, enabled: true },
    gamma: { min: 0.9, max: 1.1, enabled: false },
    
    // Effects
    vignette: { min: 0, max: 0.3, enabled: false },
    noise: { min: 0, max: 0.05, enabled: false },
    waveformShift: { min: 0, max: 2, enabled: false },
    pixelShift: { min: 0, max: 2, enabled: false },
    
    // Transformations
    speed: { min: 0.95, max: 1.05, enabled: true },
    zoom: { min: 1, max: 1.05, enabled: false },
    rotation: { min: -2, max: 2, enabled: false },
    flipHorizontal: false,
    
    // Size & Trim
    pixelSize: "",
    randomPixelSize: false,
    trimStart: { min: 0, max: 1, enabled: true },
    trimEnd: { min: 0, max: 1, enabled: false },
    
    // Special Features
    usMetadata: false,
    blurredBorder: { min: 0, max: 30, enabled: false },
    
    // Audio
    volume: { min: 0.9, max: 1.1, enabled: false },
    
    // Watermark
    watermark: {
      enabled: false,
      size: 100,
      opacity: 0.5,
      x: 0.5,
      y: 0.5,
    }
  };
  
  // Update usePresets with our extended settings
  const {
    settings,
    presetName,
    presets,
    setPresetName,
    updateSettingParam,
    savePreset,
    loadPreset,
    deletePreset
  } = usePresets(defaultSettings);
  
  // Using ephemeral anchors for downloads; no pre-created hidden link is necessary.


  const handleStartProcess = async () => {
    try {
      const processedVideos = await processVideo(numCopies, settings);
      if (processedVideos) {
        // Switch to results tab
        setActiveTab("results");
      }
    } catch (error) {
      console.error('Error in handleStartProcess:', error);
    }
  };

  const updateWatermarkParam = (param: string, value: any) => {
    // Create a copy of the settings
    const newSettings = { ...settings };
    // Update the specific watermark parameter
    newSettings.watermark[param] = value;
    // Update the settings using the generic updateSettingParam
    updateSettingParam('watermark', '', newSettings.watermark);
  };

  const handlePreview = (fileName: string, fileUrl: string) => {
    console.log(`Preview requested: ${fileName} from ${fileUrl}`);
    if (!fileUrl) {
      toast({
        title: "Preview error",
        description: "No file URL available to preview.",
        variant: "destructive"
      });
      return;
    }
    
    // Force HTTPS for preview URLs
    const secureUrl = fileUrl.replace('http://', 'https://');
    setCurrentPreview(fileName);
    setCurrentPreviewUrl(secureUrl);
    setShowPreview(true);
    
    console.log(`Previewing ${fileName} from ${secureUrl}`);
  };

  const handleDownload = (fileName: string, fileUrl: string) => {
    console.log(`Download requested: ${fileName} from ${fileUrl}`);
    if (!fileUrl) {
      toast({
        title: "Download error",
        description: "No file URL available to download.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Force HTTPS and use a more robust download method
      const secureUrl = fileUrl.replace('http://', 'https://');
      
      // Use fetch to download the file with proper headers
      fetch(secureUrl, {
        method: 'GET',
        headers: {
          'Accept': 'video/mp4,*/*'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log(`Download initiated: ${fileName}`);
        toast({ title: "Download started", description: `Downloading ${fileName}`, variant: "default" });
      })
      .catch(error => {
        console.error('Download error:', error);
        toast({ 
          title: "Download failed", 
          description: `Error: ${error.message}. Try opening the video URL directly.`, 
          variant: "destructive" 
        });
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: "Download failed", description: "There was an error downloading the file.", variant: "destructive" });
    }
  };

  const handleDownloadAll = () => {
    console.log(`Download all requested, ${results.length} files`);
    if (results.length === 0) {
      toast({
        title: "No results available",
        description: "Process a video first to generate results.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Preparing download",
      description: "Downloading all videos...",
      variant: "default"
    });
    
    // Download each file with a delay
    results.forEach((result, index) => {
      setTimeout(() => handleDownload(result.name, result.url), index * 500);
    });
  };

  // Handle loading a preset by its reference rather than index
  const handleLoadPreset = (presetToLoad: any) => {
    loadPreset(presetToLoad);
  };

  // Handle deleting a preset by its reference rather than index
  const handleDeletePreset = (presetToDelete: any) => {
    deletePreset(presetToDelete);
  };

  // Queue handlers
  const handleFilesSelect = (files: File[]) => {
    addVideosToQueue(files, settings, numCopies);
  };

  const handlePreviewQueueItem = (fileName: string, fileUrl: string) => {
    handlePreview(fileName, fileUrl);
  };

  const handleDownloadQueueItem = (fileName: string, fileUrl: string) => {
    handleDownload(fileName, fileUrl);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Video Repurposer</h1>
          <p className="text-gray-400 mt-1">
            Create multiple unique variants of your videos with custom parameters
          </p>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          console.log(`Tab changed to: ${value}`);
          setActiveTab(value);
        }} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="process">Process Video</TabsTrigger>
          <TabsTrigger value="presets">Manage Presets</TabsTrigger>
          <TabsTrigger value="results" disabled={results.length === 0}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="process">
          <ProcessTab 
            uploadedFile={uploadedFile}
            uploadProgress={uploadProgress}
            numCopies={numCopies}
            setNumCopies={setNumCopies}
            processing={processing}
            progress={progress}
            handleFileSelect={handleFileSelect}
            handleStartProcess={handleStartProcess}
            settings={settings}
            updateSettingParam={updateSettingParam}
            updateWatermarkParam={updateWatermarkParam}
            // Queue props
            queue={queue}
            isQueueProcessing={isQueueProcessing}
            currentQueueItem={currentQueueItem}
            onFilesSelect={handleFilesSelect}
            onProcessQueue={processQueue}
            onRemoveFromQueue={removeFromQueue}
            onRetryQueueItem={retryItem}
            onClearQueue={clearQueue}
            onPreviewQueueItem={handlePreviewQueueItem}
            onDownloadQueueItem={handleDownloadQueueItem}
          />
        </TabsContent>

        <TabsContent value="presets">
          <PresetManager
            presets={presets}
            presetName={presetName}
            setPresetName={setPresetName}
            onSavePreset={savePreset}
            onLoadPreset={handleLoadPreset}
            onDeletePreset={handleDeletePreset}
          />
        </TabsContent>

        <TabsContent value="results">
          <ResultsTab
            results={results}
            handlePreview={handlePreview}
            handleDownload={handleDownload}
            handleDownloadAll={handleDownloadAll}
          />
        </TabsContent>
      </Tabs>
      
      {/* Video Preview Dialog */}
      <VideoPreview 
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        currentPreview={currentPreview}
        currentPreviewUrl={currentPreviewUrl}
      />
    </div>
  );
};

export default VideoRepurposer;
