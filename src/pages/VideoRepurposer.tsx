import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { useVideoQueueContext } from '@/contexts/VideoQueueContext';
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

  // Use global video queue context
  const {
    queue,
    isProcessing: isQueueProcessing,
    currentItem: currentQueueItem,
    addVideosToQueue,
    removeFromQueue,
    clearQueue,
    retryItem,
    processQueue,
    globalResults,
    addResults,
    clearResults
  } = useVideoQueueContext();

  // Simplified default settings - only proven working parameters
  const defaultSettings = {
    // Video Quality
    videoBitrate: { min: 3000, max: 8000, enabled: true },
    frameRate: { min: 25, max: 30, enabled: false },
    
    // Color Adjustments - Core parameters that work reliably
    saturation: { min: 1.2, max: 1.5, enabled: true },
    contrast: { min: 0.9, max: 1.1, enabled: true },
    brightness: { min: -0.1, max: 0.1, enabled: true },
    
    // Simple Transformations
    speed: { min: 0.95, max: 1.05, enabled: true },
    flipHorizontal: false,
    
    // Trim timing
    trimStart: { min: 0, max: 1, enabled: true },
    trimEnd: { min: 0, max: 1, enabled: false },
    
    // Audio
    volume: { min: 0.9, max: 1.1, enabled: false }
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
    deletePreset,
    exportPresets,
    importPresets
  } = usePresets(defaultSettings);
  
  // Using ephemeral anchors for downloads; no pre-created hidden link is necessary.


  const handleStartProcess = async () => {
    try {
      const processedVideos = await processVideo(numCopies, settings);
      if (processedVideos) {
        // Add to global results
        addResults(processedVideos, 'single');
        // Switch to results tab
        setActiveTab("results");
      }
    } catch (error) {
      console.error('Error in handleStartProcess:', error);
    }
  };

  // Removed watermark functionality - simplified interface

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

  const handleDownload = async (fileName: string, fileUrl: string) => {
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
      // Use Supabase edge function to proxy the download
      const response = await fetch(`https://ekrvkgvojajchfytjvzk.supabase.co/functions/v1/download-processed-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcnZrZ3ZvamFqY2hmeXRqdnprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODM2MzgsImV4cCI6MjA3Mjc1OTYzOH0.hUhjd5N20iz_jzbtvMiZwRfhxaTtaIACd2bqMT3tldc`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcnZrZ3ZvamFqY2hmeXRqdnprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODM2MzgsImV4cCI6MjA3Mjc1OTYzOH0.hUhjd5N20iz_jzbtvMiZwRfhxaTtaIACd2bqMT3tldc'
        },
        body: JSON.stringify({ videoUrl: fileUrl })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`Download initiated: ${fileName}`);
      
      toast({
        title: "Download started",
        description: `${fileName} is being downloaded.`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "An error occurred while downloading the video.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadAll = () => {
    console.log(`Download all requested, ${globalResults.length} files`);
    if (globalResults.length === 0) {
      toast({
        title: "No results available",
        description: "Process videos first to generate results.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Preparing download",
      description: `Downloading all ${globalResults.length} videos...`,
      variant: "default"
    });
    
    // Download each file with a delay
    globalResults.forEach((result, index) => {
      setTimeout(() => handleDownload(result.name, result.url), index * 500);
    });
  };

  const handleClearResults = () => {
    clearResults();
    setResults([]);
    toast({
      title: "Results cleared",
      description: "All video results have been removed.",
      variant: "default"
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
          <TabsTrigger value="results">
            Results ({globalResults.length})
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
            updateWatermarkParam={() => {}}
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
            onExportPresets={exportPresets}
            onImportPresets={importPresets}
          />
        </TabsContent>

        <TabsContent value="results">
          <ResultsTab
            results={globalResults}
            handlePreview={handlePreview}
            handleDownload={handleDownload}
            handleDownloadAll={handleDownloadAll}
            handleClearResults={handleClearResults}
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
