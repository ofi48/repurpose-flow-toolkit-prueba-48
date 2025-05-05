
import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { usePresets } from '@/hooks/usePresets';

// Import refactored components
import ProcessTab from '@/components/video/ProcessTab';
import PresetManager from '@/components/video/PresetManager';
import ResultsTab from '@/components/video/ResultsTab';
import VideoPreview from '@/components/video/VideoPreview';

// Import FFmpeg
import { createFFmpeg } from '@ffmpeg/ffmpeg';

// Initialize FFmpeg
const ffmpeg = createFFmpeg({ 
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

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

  const {
    settings,
    presetName,
    presets,
    setPresetName,
    updateSettingParam,
    savePreset,
    loadPreset,
    deletePreset
  } = usePresets();
  
  // Create a ref for the hidden download link
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);

  // Create a bucket for videos if it doesn't exist (this would normally be done in a migration)
  React.useEffect(() => {
    const initStorage = async () => {
      try {
        // Check if the bucket already exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'videos');
        
        if (!bucketExists) {
          const { error } = await supabase.storage.createBucket('videos', {
            public: true,
            fileSizeLimit: 50000000, // 50MB limit
          });
          
          if (error) {
            console.error('Error creating bucket:', error);
          } else {
            console.log('Videos bucket created');
          }
        }
      } catch (error) {
        console.error('Error initializing storage:', error);
      }
    };
    
    initStorage();
  }, []);

  // Initialize download link
  React.useEffect(() => {
    if (!downloadLinkRef.current) {
      const link = document.createElement('a');
      link.style.display = 'none';
      document.body.appendChild(link);
      downloadLinkRef.current = link;
    }
    
    return () => {
      if (downloadLinkRef.current) {
        document.body.removeChild(downloadLinkRef.current);
      }
    };
  }, []);

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
    
    setCurrentPreview(fileName);
    setCurrentPreviewUrl(fileUrl);
    setShowPreview(true);
    
    console.log(`Previewing ${fileName} from ${fileUrl}`);
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
      if (!downloadLinkRef.current) {
        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);
        downloadLinkRef.current = link;
      }
      
      // Set link properties and click it
      downloadLinkRef.current.href = fileUrl;
      downloadLinkRef.current.download = fileName;
      downloadLinkRef.current.click();
      
      console.log(`Download initiated: ${fileName}`);
      
      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file.",
        variant: "destructive"
      });
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

      {!ffmpegLoaded && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-600/20 rounded-md">
          <p className="text-yellow-500">Loading video processing library... This may take a moment.</p>
        </div>
      )}

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
          />
        </TabsContent>

        <TabsContent value="presets">
          <PresetManager
            presets={presets}
            presetName={presetName}
            setPresetName={setPresetName}
            onSavePreset={savePreset}
            onLoadPreset={loadPreset}
            onDeletePreset={deletePreset}
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
