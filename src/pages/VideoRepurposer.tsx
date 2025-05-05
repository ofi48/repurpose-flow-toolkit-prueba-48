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

const VideoRepurposer = () => {
  const [activeTab, setActiveTab] = useState("process");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [numCopies, setNumCopies] = useState(3);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{name: string, url: string}[]>([]);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<{name: string, settings: VideoPresetSettings}[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreview, setCurrentPreview] = useState("");
  const { toast } = useToast();
  
  // Create a ref for the hidden download link
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);

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

  // Initialize and clean up download link and blob URLs
  useEffect(() => {
    console.log("Component mounted or results changed");
    
    // Create a hidden download link if it doesn't exist
    if (!downloadLinkRef.current) {
      const link = document.createElement('a');
      link.style.display = 'none';
      document.body.appendChild(link);
      downloadLinkRef.current = link;
      console.log("Download link created");
    }
    
    return () => {
      // Clean up any blob URLs when component unmounts
      if (results.length > 0) {
        console.log("Cleaning up blob URLs:", results.length);
        results.forEach(result => {
          if (result.url.startsWith('blob:')) {
            URL.revokeObjectURL(result.url);
          }
        });
      }
      
      // Remove the download link
      if (downloadLinkRef.current) {
        document.body.removeChild(downloadLinkRef.current);
        downloadLinkRef.current = null;
      }
    };
  }, [results]);

  const handleFileSelect = (file: File) => {
    console.log("File selected:", file.name);
    
    // Reset progress and processing state when a new file is uploaded
    setProgress(0);
    setProcessing(false);
    setUploadedFile(file);
    setResults([]);
    
    // Ensure we stay on the process tab after file upload
    setActiveTab("process");
    
    toast({
      title: "File uploaded",
      description: `${file.name} uploaded successfully.`,
      variant: "default"
    });
  };

  const handleStartProcess = () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a video file to continue.",
        variant: "destructive"
      });
      return;
    }

    console.log("Starting processing:", uploadedFile.name);
    setProcessing(true);
    
    // Simulate processing - in a real app, this would call an API
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += (100 / (numCopies * 10));
      
      if (progressValue >= 100) {
        clearInterval(interval);
        finishProcessing();
        return;
      }
      
      setProgress(progressValue);
    }, 300);
  };

  const finishProcessing = () => {
    console.log("Processing complete");
    setProcessing(false);
    setProgress(100);
    
    try {
      // Generate mock video blobs for download
      const mockResults = [];
      for (let i = 0; i < numCopies; i++) {
        const fileName = `${uploadedFile?.name?.split('.')[0]}_variant_${i+1}.mp4`;
        
        // Create a mock video blob (in real app, this would be actual video data)
        const mockVideoContent = new Uint8Array([0, 1, 2, 3]); // Minimal binary data to represent a file
        const blob = new Blob([mockVideoContent], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        
        console.log(`Created blob URL: ${url} for ${fileName}`);
        
        mockResults.push({
          name: fileName,
          url: url
        });
      }
      
      setResults(mockResults);
      
      toast({
        title: "Processing complete",
        description: `Generated ${numCopies} video variants.`,
        variant: "default"
      });
      
      // Only switch to results tab if we have results
      if (mockResults.length > 0) {
        console.log("Switching to results tab");
        setActiveTab("results");
      }
    } catch (error) {
      console.error("Error generating results:", error);
      toast({
        title: "Error generating results",
        description: "An error occurred while creating video variants.",
        variant: "destructive"
      });
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
      // Use the actual blob URL that was created
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
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-600" />
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
          
          <div className="aspect-video bg-black rounded-md flex items-center justify-center">
            {/* In a real app, you would render a video player here */}
            <div className="text-center p-8">
              <Video className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-300">{currentPreview}</p>
              <p className="text-gray-400 mt-2 text-sm">
                (This is a simulated preview. In a real app, a video player would be shown here)
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoRepurposer;
