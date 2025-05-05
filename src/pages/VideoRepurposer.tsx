
import React, { useState, useRef } from 'react';
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
  const [results, setResults] = useState<string[]>([]);
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

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setResults([]);
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

    setProcessing(true);
    
    // Simulate processing - in a real app, this would call an API
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          
          // Mock results - create blob URLs to make videos downloadable
          const mockResults = [];
          for (let i = 0; i < numCopies; i++) {
            mockResults.push(`${uploadedFile.name.split('.')[0]}_variant_${i+1}.mp4`);
          }
          setResults(mockResults);
          
          toast({
            title: "Processing complete",
            description: `Generated ${numCopies} video variants.`,
            variant: "default"
          });
          
          setActiveTab("results");
          return 100;
        }
        return prev + (100 / (numCopies * 10));
      });
    }, 300);
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

  const handlePreview = (fileName: string) => {
    setCurrentPreview(fileName);
    setShowPreview(true);
    
    // In a real app, you would fetch the video URL from your backend
    console.log(`Previewing ${fileName}`);
  };

  const handleDownload = (fileName: string) => {
    // In a real app, you would get the actual file URL from your backend
    // For now, we'll simulate a download by creating a dummy blob
    
    // Create a blob that represents the video (this is just a placeholder)
    const blob = new Blob(['Simulated video content for ' + fileName], 
      { type: 'video/mp4' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    if (!downloadLinkRef.current) {
      const link = document.createElement('a');
      link.style.display = 'none';
      document.body.appendChild(link);
      downloadLinkRef.current = link;
    }
    
    // Set link properties and click it
    downloadLinkRef.current.href = url;
    downloadLinkRef.current.download = fileName;
    downloadLinkRef.current.click();
    
    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    toast({
      title: "Download started",
      description: `Downloading ${fileName}`,
      variant: "default"
    });
  };

  const handleDownloadAll = () => {
    toast({
      title: "Preparing download",
      description: "Preparing to download all videos...",
      variant: "default"
    });
    
    // In a real app, you would use JSZip or a similar library to zip multiple files
    // For now, just simulate downloading each file with a delay
    results.forEach((result, index) => {
      setTimeout(() => handleDownload(result), index * 500);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <div key={index} className="bg-app-dark-accent border border-gray-700 rounded-lg overflow-hidden">
                <div className="aspect-video bg-black flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-600" />
                </div>
                <div className="p-3">
                  <p className="font-medium truncate">{result}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 mr-2"
                      onClick={() => handlePreview(result)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownload(result)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
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
