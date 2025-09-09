import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import FileUpload from '@/components/FileUpload';
import ParameterSlider from '@/components/ParameterSlider';
import ProgressBar from '@/components/ProgressBar';
import { ImagePresetSettings } from '@/types/preset';
import { Check, Download, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const ImageSpoofer = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [numCopies, setNumCopies] = useState(3);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; url: string }[]>([]);
  const { toast } = useToast();

  // Settings
  const [settings, setSettings] = useState<ImagePresetSettings>({
    flipHorizontal: true,
    brightness: { min: 0.9, max: 1.1, enabled: true },
    contrast: { min: 0.9, max: 1.1, enabled: true },
    saturation: { min: 0.9, max: 1.1, enabled: true },
    blurBorder: false,
    compression: { min: 80, max: 95, enabled: true }
  });

  const handleFileSelect = (file: File) => {
    setCurrentFile(file);
    if (!uploadedFiles.some(f => f.name === file.name)) {
      setUploadedFiles(prev => [...prev, file]);
    }
    setResults([]);
  };

  const applyImageEffects = async (file: File, variantIndex: number): Promise<{ name: string; url: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;

        // Random flip horizontal
        const shouldFlip = settings.flipHorizontal && Math.random() > 0.5;
        if (shouldFlip) {
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
        }

        // Apply filter effects
        const filters = [];
        
        if (settings.brightness.enabled) {
          const brightness = Math.random() * (settings.brightness.max - settings.brightness.min) + settings.brightness.min;
          filters.push(`brightness(${brightness})`);
        }
        
        if (settings.contrast.enabled) {
          const contrast = Math.random() * (settings.contrast.max - settings.contrast.min) + settings.contrast.min;
          filters.push(`contrast(${contrast})`);
        }
        
        if (settings.saturation.enabled) {
          const saturation = Math.random() * (settings.saturation.max - settings.saturation.min) + settings.saturation.min;
          filters.push(`saturate(${saturation})`);
        }

        ctx.filter = filters.join(' ');
        ctx.drawImage(img, 0, 0);

        // Apply blur border if enabled
        if (settings.blurBorder) {
          const borderSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.02);
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - borderSize,
            canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2
          );
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
          
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Convert to blob with compression
        const quality = settings.compression.enabled 
          ? (Math.random() * (settings.compression.max - settings.compression.min) + settings.compression.min) / 100
          : 0.9;

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const name = `${file.name.split('.')[0]}_variant_${variantIndex + 1}.${file.name.split('.').pop()}`;
            resolve({ name, url });
          }
        }, `image/${file.name.split('.').pop() === 'png' ? 'png' : 'jpeg'}`, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleStartProcess = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one image to continue.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    
    try {
      const allResults = [];
      const totalVariants = uploadedFiles.length * numCopies;
      let processedVariants = 0;

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        for (let j = 0; j < numCopies; j++) {
          const result = await applyImageEffects(file, j);
          allResults.push(result);
          
          processedVariants++;
          setProgress((processedVariants / totalVariants) * 100);
        }
      }
      
      setResults(allResults);
      setProcessing(false);
      
      toast({
        title: "Processing complete",
        description: `Generated ${allResults.length} image variants with real effects applied.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error processing images:', error);
      setProcessing(false);
      toast({
        title: "Processing failed",
        description: "An error occurred while processing the images.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = (fileName: string, fileUrl: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    results.forEach((result, index) => {
      setTimeout(() => {
        handleDownload(result.name, result.url);
      }, index * 100); // Stagger downloads
    });
    
    toast({
      title: "Download started",
      description: `Downloading ${results.length} image variants.`,
      variant: "default"
    });
  };

  const updateSettingParam = (
    param: keyof ImagePresetSettings, 
    subParam: 'min' | 'max' | 'enabled', 
    value: number | boolean
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      if (typeof prev[param] === 'boolean') {
        // @ts-ignore - We're handling this properly, TypeScript just can't infer it
        newSettings[param] = value;
      } else {
        // @ts-ignore - We're handling this properly, TypeScript just can't infer it
        newSettings[param] = { ...prev[param], [subParam]: value };
      }
      return newSettings;
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Image Spoofer</h1>
          <p className="text-gray-400 mt-1">
            Create multiple randomized versions of your images
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <FileUpload 
            onFileSelect={handleFileSelect}
            acceptedFileTypes=".jpg,.jpeg,.png,.webp"
            label="Upload Image"
          />

          <div className="parameter-card">
            <Label className="text-sm font-medium block mb-2">Uploaded Images ({uploadedFiles.length})</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uploadedFiles.length > 0 ? (
                uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-app-dark p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                    >
                      ✕
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No images uploaded yet</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Copies Per Image</Label>
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
              disabled={processing || uploadedFiles.length === 0}
            >
              {processing ? 'Processing...' : 'Generate Variants'}
            </Button>
            
            {processing && (
              <ProgressBar value={progress} label="Processing image variants" />
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="parameter-card space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="flip-horizontal" 
                  checked={settings.flipHorizontal} 
                  onCheckedChange={(checked) => setSettings(prev => ({...prev, flipHorizontal: !!checked}))} 
                />
                <Label htmlFor="flip-horizontal" className="text-sm font-medium">
                  Flip Horizontally (Random)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="blur-border" 
                  checked={settings.blurBorder} 
                  onCheckedChange={(checked) => setSettings(prev => ({...prev, blurBorder: !!checked}))} 
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
              onMinChange={(value) => updateSettingParam('brightness', 'min', value)}
              onMaxChange={(value) => updateSettingParam('brightness', 'max', value)}
              onToggle={(checked) => updateSettingParam('brightness', 'enabled', checked)}
            />
            
            <ParameterSlider
              title="Contrast"
              min={0.7}
              max={1.3}
              step={0.05}
              minValue={settings.contrast.min}
              maxValue={settings.contrast.max}
              enabled={settings.contrast.enabled}
              onMinChange={(value) => updateSettingParam('contrast', 'min', value)}
              onMaxChange={(value) => updateSettingParam('contrast', 'max', value)}
              onToggle={(checked) => updateSettingParam('contrast', 'enabled', checked)}
            />
            
            <ParameterSlider
              title="Saturation"
              min={0.7}
              max={1.3}
              step={0.05}
              minValue={settings.saturation.min}
              maxValue={settings.saturation.max}
              enabled={settings.saturation.enabled}
              onMinChange={(value) => updateSettingParam('saturation', 'min', value)}
              onMaxChange={(value) => updateSettingParam('saturation', 'max', value)}
              onToggle={(checked) => updateSettingParam('saturation', 'enabled', checked)}
            />
            
            <ParameterSlider
              title="Compression"
              min={50}
              max={100}
              step={1}
              minValue={settings.compression.min}
              maxValue={settings.compression.max}
              enabled={settings.compression.enabled}
              onMinChange={(value) => updateSettingParam('compression', 'min', value)}
              onMaxChange={(value) => updateSettingParam('compression', 'max', value)}
              onToggle={(checked) => updateSettingParam('compression', 'enabled', checked)}
            />
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Generated Images</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((result, index) => (
                  <div key={index} className="bg-app-dark-accent border border-gray-700 rounded-lg overflow-hidden">
                     <div className="aspect-square bg-black flex items-center justify-center overflow-hidden">
                       <img 
                         src={result.url} 
                         alt={result.name}
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           e.currentTarget.src = '';
                           e.currentTarget.style.display = 'none';
                         }}
                       />
                     </div>
                     <div className="p-2">
                       <p className="text-xs font-medium truncate">{result.name}</p>
                       <Button 
                         size="sm" 
                         className="w-full mt-2"
                         onClick={() => handleDownload(result.name, result.url)}
                       >
                         <Download className="h-3 w-3 mr-1" />
                         Download
                       </Button>
                     </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-4">
                <div>
                  <p className="text-sm text-gray-400">
                    Generated {results.length} image variants
                  </p>
                </div>
                 <Button onClick={handleDownloadAll}>
                   <Download className="mr-2 h-4 w-4" />
                   Download All
                 </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSpoofer;
