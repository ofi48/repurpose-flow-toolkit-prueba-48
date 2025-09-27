import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FileUpload from '@/components/FileUpload';
import ParameterSlider from '@/components/ParameterSlider';
import ProgressBar from '@/components/ProgressBar';
import ImageProcessTab from '@/components/image/ImageProcessTab';
import ImageResultsTab from '@/components/image/ImageResultsTab';
import { ImagePresetSettings } from '@/types/preset';
import { Check, Download, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useImageQueue } from '@/hooks/useImageQueue';
import { useGlobalResults } from '@/hooks/useGlobalResults';

const ImageSpoofer = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [numCopies, setNumCopies] = useState(3);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; url: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; fileName: string; fileUrl: string }>({
    open: false,
    fileName: '',
    fileUrl: ''
  });
  const { toast } = useToast();
  
  // Global results and queue management
  const { globalResults, addResults, clearResults } = useGlobalResults();
  const imageQueue = useImageQueue();

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
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setCurrentFile(file);
          if (!uploadedFiles.some(f => f.name === file.name)) {
            setUploadedFiles(prev => [...prev, file]);
          }
          setResults([]);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
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
      
      // Add to global results
      addResults(allResults, 'single');
      
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

  const handleDownloadAllSingle = () => {
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

  // Queue management functions
  const handleAddToQueue = (files: File[]) => {
    imageQueue.addImagesToQueue(files, settings, numCopies);
  };

  const handlePreview = (fileName: string, fileUrl: string) => {
    setPreviewDialog({ open: true, fileName, fileUrl });
  };

  const handleDownloadAllGlobal = () => {
    const allResults = globalResults.filter(r => r.name.includes('variant'));
    allResults.forEach((result, index) => {
      setTimeout(() => {
        handleDownload(result.name, result.url);
      }, index * 100);
    });
    
    toast({
      title: "Download started",
      description: `Downloading ${allResults.length} image variants.`,
      variant: "default"
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

      <Tabs defaultValue="process" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="process">Process Images</TabsTrigger>
          <TabsTrigger value="results">Results ({globalResults.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="process">
          <ImageProcessTab
            currentFile={currentFile}
            onFileSelect={handleFileSelect}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            numCopies={numCopies}
            onNumCopiesChange={setNumCopies}
            onStartProcess={handleStartProcess}
            isProcessing={processing}
            progress={progress}
            settings={settings}
            onSettingChange={updateSettingParam}
            queue={imageQueue.queue}
            queueIsProcessing={imageQueue.isProcessing}
            currentQueueItem={imageQueue.currentItem}
            onAddToQueue={handleAddToQueue}
            onProcessQueue={imageQueue.processQueue}
            onRemoveFromQueue={imageQueue.removeFromQueue}
            onRetryQueueItem={imageQueue.retryItem}
            onClearQueue={imageQueue.clearQueue}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAllGlobal}
          />
        </TabsContent>

        <TabsContent value="results">
          <ImageResultsTab
            results={globalResults}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAllGlobal}
            onClearResults={clearResults}
          />
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewDialog.fileName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <img 
              src={previewDialog.fileUrl} 
              alt={previewDialog.fileName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              onClick={() => handleDownload(previewDialog.fileName, previewDialog.fileUrl)}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ImageSpoofer;
