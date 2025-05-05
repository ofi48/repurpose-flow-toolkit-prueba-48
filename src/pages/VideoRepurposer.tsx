import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUpload from '@/components/FileUpload';
import ParameterSlider from '@/components/ParameterSlider';
import ProgressBar from '@/components/ProgressBar';
import { Check, Download, Play, Save, Video, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { VideoPresetSettings } from '@/types/preset';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { supabase, generateFileName, getPublicUrl, uploadFileWithProgress, SUPABASE_ANON_KEY } from "@/integrations/supabase/client";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// Initialize FFmpeg
const ffmpeg = createFFmpeg({ 
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const VideoRepurposer = () => {
  const [activeTab, setActiveTab] = useState("process");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [numCopies, setNumCopies] = useState(3);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{name: string, url: string, processingDetails?: any}[]>([]);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<{name: string, settings: VideoPresetSettings}[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreview, setCurrentPreview] = useState("");
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const { toast } = useToast();
  
  // Create a ref for the hidden download link
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Preset settings
  const [settings, setSettings] = useState<VideoPresetSettings>({
    speed: { min: 0.9, max: 1.1, enabled: true },
    trimStart: { min: 0, max: 0.5, enabled: true },
    trimEnd: { min: 0, max: 0.5, enabled: false },
    saturation: { min: 0.9, max: 1.1, enabled: true },
    contrast: { min: 0.9, max: 1.1, enabled: true },
    brightness: { min: 0.9, max: 1.1, enabled: true },
    audioBitrate: { min: 96, max: 128, enabled: false },
    flipHorizontal: false
  });

  // Load FFmpeg on component mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpeg.isLoaded()) {
          await ffmpeg.load();
          console.log('FFmpeg loaded successfully');
          setFfmpegLoaded(true);
        }
      } catch (error) {
        console.error('Error loading FFmpeg:', error);
        toast({
          title: "FFmpeg error",
          description: "Could not initialize video processing library. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    loadFFmpeg();
  }, []);

  // Initialize download link
  useEffect(() => {
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

  // Create a bucket for videos if it doesn't exist (this would normally be done in a migration)
  useEffect(() => {
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

  const handleFileSelect = async (file: File) => {
    console.log("File selected:", file.name);
    
    // Reset states
    setProgress(0);
    setProcessing(false);
    setUploadedFile(file);
    setResults([]);
    setUploadProgress(0);
    
    // Ensure we stay on the process tab
    setActiveTab("process");
    
    try {
      // Upload the file to Supabase storage using our new helper function
      const fileName = generateFileName(file.name);
      
      const { path, error } = await uploadFileWithProgress(
        'videos', 
        fileName, 
        file, 
        (progress) => setUploadProgress(progress)
      );
        
      if (error) {
        throw error;
      }
      
      // Get the public URL for the uploaded file
      const publicUrl = getPublicUrl('videos', fileName);
      setUploadedFileUrl(publicUrl);
      
      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the file.",
        variant: "destructive"
      });
      
      // Reset the file selection
      setUploadedFile(null);
    }
  };

  // Generate a random number between min and max
  const getRandomValue = (min: number, max: number) => {
    return min + Math.random() * (max - min);
  };

  // Get values for processing parameters based on settings
  const generateProcessingParameters = () => {
    const params = {
      speed: settings.speed.enabled ? getRandomValue(settings.speed.min, settings.speed.max) : 1,
      trimStart: settings.trimStart.enabled ? getRandomValue(settings.trimStart.min, settings.trimStart.max) : 0,
      trimEnd: settings.trimEnd.enabled ? getRandomValue(settings.trimEnd.min, settings.trimEnd.max) : 0,
      saturation: settings.saturation.enabled ? getRandomValue(settings.saturation.min, settings.saturation.max) : 1,
      contrast: settings.contrast.enabled ? getRandomValue(settings.contrast.min, settings.contrast.max) : 1,
      brightness: settings.brightness.enabled ? getRandomValue(settings.brightness.min, settings.brightness.max) : 1,
      audioBitrate: settings.audioBitrate.enabled ? Math.round(getRandomValue(settings.audioBitrate.min, settings.audioBitrate.max)) : 128,
      flipHorizontal: settings.flipHorizontal
    };
    
    return params;
  };

  // Build FFmpeg complex filter for a video variant
  const buildComplexFilter = (params) => {
    let filter = '';
    
    // Add saturation filter if enabled
    if (settings.saturation.enabled) {
      filter += `eq=saturation=${params.saturation}:`;
    }
    
    // Add contrast filter if enabled
    if (settings.contrast.enabled) {
      filter += `contrast=${params.contrast}:`;
    }
    
    // Add brightness filter if enabled
    if (settings.brightness.enabled) {
      filter += `brightness=${params.brightness}`;
    }
    
    // Remove trailing colon if present
    if (filter.endsWith(':')) {
      filter = filter.slice(0, -1);
    }
    
    // Add flip filter if enabled
    if (params.flipHorizontal) {
      filter = filter ? `${filter},hflip` : 'hflip';
    }
    
    return filter;
  };

  // Process video with FFmpeg
  const processVideoWithFFmpeg = async (inputFileName: string, outputFileName: string, params) => {
    try {
      // Write the input file to FFmpeg's virtual file system
      ffmpeg.FS('writeFile', inputFileName, await fetchFile(uploadedFile));
      
      // Build the FFmpeg command
      const filterComplex = buildComplexFilter(params);
      const command = ['-i', inputFileName];
      
      // Add trim parameters if enabled
      if (settings.trimStart.enabled && params.trimStart > 0) {
        command.push('-ss', `${params.trimStart}`);
      }
      
      // Add speed/tempo adjustment if enabled
      if (settings.speed.enabled && params.speed !== 1) {
        command.push('-filter:a', `atempo=${params.speed}`, '-filter:v', `setpts=1/${params.speed}*PTS`);
      }
      
      // Add video filters if any
      if (filterComplex) {
        command.push('-vf', filterComplex);
      }
      
      // Add audio bitrate if enabled
      if (settings.audioBitrate.enabled) {
        command.push('-b:a', `${params.audioBitrate}k`);
      }
      
      // Add output file name and format
      command.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22', outputFileName);
      
      console.log('FFmpeg command:', command);
      
      // Execute the command
      await ffmpeg.run(...command);
      
      // Read the result
      const data = ffmpeg.FS('readFile', outputFileName);
      
      // Create a URL for the processed video
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      
      return {
        blob,
        url: URL.createObjectURL(blob),
        name: outputFileName,
        processingDetails: params
      };
    } catch (error) {
      console.error('Error processing video with FFmpeg:', error);
      throw error;
    }
  };

  const handleStartProcess = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a video file to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!ffmpegLoaded) {
      toast({
        title: "FFmpeg not ready",
        description: "Video processing library is still loading. Please wait a moment and try again.",
        variant: "destructive"
      });
      return;
    }

    console.log("Starting processing:", uploadedFile.name);
    setProcessing(true);
    setProgress(0);
    setResults([]);
    
    try {
      const inputFileName = 'input.mp4';
      const totalVariants = numCopies;
      const processedVideos = [];
      
      for (let i = 0; i < totalVariants; i++) {
        // Update progress
        setProgress(Math.round((i / totalVariants) * 100));
        
        // Generate random parameters for this variant
        const params = generateProcessingParameters();
        const outputFileName = `output_${i}.mp4`;
        
        // Process the video
        const result = await processVideoWithFFmpeg(inputFileName, outputFileName, params);
        
        // Add to results
        processedVideos.push({
          name: `variant_${i + 1}.mp4`,
          url: result.url,
          processingDetails: params
        });
        
        // Upload to Supabase storage if needed
        if (uploadedFileUrl) {
          const fileName = generateFileName(`variant_${i + 1}.mp4`);
          await uploadFileWithProgress(
            'videos', 
            fileName, 
            new File([result.blob], fileName, { type: 'video/mp4' }),
            (progress) => console.log(`Uploading variant ${i + 1}: ${progress}%`)
          );
        }
      }
      
      // Update the progress to 100%
      setProgress(100);
      
      // Set the results
      setResults(processedVideos);
      
      toast({
        title: "Processing complete",
        description: `Generated ${processedVideos.length} video variants.`,
        variant: "default"
      });
      
      // Switch to results tab
      setActiveTab("results");
    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        title: "Processing failed",
        description: error.message || "An error occurred while processing the video.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Preset name required",
        description: "Please enter a name for your preset.",
        variant: "destructive"
      });
      return;
    }

    // Check if preset name already exists
    if (presets.some(preset => preset.name === presetName)) {
      toast({
        title: "Preset name already exists",
        description: "Please choose a different name for your preset.",
        variant: "destructive"
      });
      return;
    }

    // Save preset
    const newPreset = {
      name: presetName,
      settings: {...settings}
    };
    
    setPresets([...presets, newPreset]);
    
    toast({
      title: "Preset saved",
      description: `"${presetName}" preset has been saved.`,
      variant: "default"
    });
    
    setPresetName("");
  };

  const updateSettingParam = (
    param: keyof VideoPresetSettings, 
    subParam: 'min' | 'max' | 'enabled', 
    value: number | boolean
  ) => {
    setSettings(prev => {
      // Ensure we're dealing with a valid object before spreading
      const paramValue = prev[param];
      if (typeof paramValue === 'object' && paramValue !== null) {
        return {
          ...prev,
          [param]: {
            ...paramValue,
            [subParam]: value
          }
        };
      }
      
      // Handle the case where the parameter is not an object (like flipHorizontal)
      if (subParam === 'enabled' && typeof paramValue === 'boolean') {
        return {
          ...prev,
          [param]: value
        };
      }
      
      // Return unchanged if we can't update
      return prev;
    });
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

  const loadPreset = (presetIndex: number) => {
    const selectedPreset = presets[presetIndex];
    setSettings(selectedPreset.settings);
    
    toast({
      title: "Preset loaded",
      description: `"${selectedPreset.name}" preset has been loaded.`,
      variant: "default"
    });
  };

  const deletePreset = (presetIndex: number) => {
    const updatedPresets = [...presets];
    updatedPresets.splice(presetIndex, 1);
    setPresets(updatedPresets);
    
    toast({
      title: "Preset deleted",
      description: "Preset has been removed.",
      variant: "default"
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
          <ProgressBar value={50} label="Loading FFmpeg..." />
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

        <TabsContent value="process" className="space-y-8">
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
                    disabled={processing || !uploadedFile || !uploadedFileUrl}
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
        </TabsContent>

        <TabsContent value="presets" className="space-y-6">
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
                    className="bg-app-dark-accent border-gray-700"
                  />
                </div>
                <Button onClick={savePreset} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Preset
                </Button>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Saved Presets</h2>
              <div className="space-y-2">
                {presets.length === 0 ? (
                  <div className="bg-app-dark-accent border border-gray-700 rounded-md p-4">
                    <p className="text-gray-400 text-center">No saved presets yet</p>
                  </div>
                ) : (
                  presets.map((preset, index) => (
                    <div key={index} className="bg-app-dark-accent border border-gray-700 rounded-md p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{preset.name}</h3>
                        <p className="text-sm text-gray-400">
                          {Object.entries(preset.settings).filter(([_, setting]) => 
                            typeof setting === 'object' ? setting.enabled : setting
                          ).length} parameters enabled
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => loadPreset(index)}>
                          Load
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deletePreset(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <h2 className="text-xl font-semibold">Generated Videos</h2>
          
          {results.length === 0 ? (
            <div className="bg-app-dark-accent border border-gray-700 rounded-md p-4 text-center">
              <p className="text-gray-400">No results yet. Process a video to generate results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result, index) => (
                <div key={index} className="bg-app-dark-accent border border-gray-700 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-black flex items-center justify-center relative">
                    <Video className="h-12 w-12 text-gray-600 absolute" />
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-xs p-2 text-white space-y-1">
                      {result.processingDetails && (
                        <>
                          <p>Speed: {result.processingDetails.speed.toFixed(2)}x</p>
                          {result.processingDetails.saturation && (
                            <p>Saturation: {result.processingDetails.saturation.toFixed(2)}</p>
                          )}
                          {result.processingDetails.contrast && (
                            <p>Contrast: {result.processingDetails.contrast.toFixed(2)}</p>
                          )}
                          {result.processingDetails.brightness && (
                            <p>Brightness: {result.processingDetails.brightness.toFixed(2)}</p>
                          )}
                          {result.processingDetails.flipHorizontal && (
                            <p>Flipped: {result.processingDetails.flipHorizontal ? 'Yes' : 'No'}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium truncate">{result.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 mr-2"
                        onClick={() => handlePreview(result.name, result.url)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDownload(result.name, result.url)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {results.length > 0 && (
            <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-6">
              <div>
                <p className="text-sm text-gray-400">
                  Generated {results.length} video variants
                </p>
              </div>
              <Button onClick={handleDownloadAll}>
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Video Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="mb-4">Video Preview</DialogTitle>
            <DialogClose />
          </DialogHeader>
          
          <div className="aspect-video bg-black rounded-md overflow-hidden">
            {currentPreviewUrl ? (
              <video 
                ref={videoRef}
                controls
                className="w-full h-full"
                src={currentPreviewUrl}
                onError={() => {
                  toast({
                    title: "Video Error",
                    description: "Could not load the video. The file may be corrupted or not supported.",
                    variant: "destructive"
                  });
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No preview available</p>
              </div>
            )}
          </div>
          
          {currentPreview && (
            <div className="mt-2 text-center">
              <p className="text-sm font-medium">{currentPreview}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoRepurposer;
