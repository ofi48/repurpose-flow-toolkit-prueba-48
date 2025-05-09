
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import FileUpload from '@/components/FileUpload';
import ProgressBar from '@/components/ProgressBar';
import { Download, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ReducedImage {
  name: string;
  originalSize: number;
  reducedSize: number;
  url: string;
  blob?: Blob;
}

const FileReducer = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(80);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ReducedImage | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setResult(null);
  };

  const handleReduce = () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please upload an image to continue.",
        variant: "destructive"
      });
      return;
    }

    // Check if file is an image
    if (!uploadedFile.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, WebP).",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    
    // Simulate initial processing steps
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 60) {
          clearInterval(progressInterval);
          return 60;
        }
        return prev + 5;
      });
    }, 100);

    // Create a canvas to resize/compress the image
    const img = new Image();
    img.onload = () => {
      // Clear the progress interval
      clearInterval(progressInterval);
      setProgress(70);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setProcessing(false);
        toast({
          title: "Processing failed",
          description: "Unable to process image. Please try again.",
          variant: "destructive"
        });
        return;
      }
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob with reduced quality
      setProgress(90);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setProcessing(false);
            toast({
              title: "Processing failed",
              description: "Failed to generate reduced image.",
              variant: "destructive"
            });
            return;
          }

          setProgress(100);
          
          // Create a URL for the blob
          const url = URL.createObjectURL(blob);
          
          // Create result object
          const reducedImage: ReducedImage = {
            name: `reduced_${uploadedFile.name}`,
            originalSize: uploadedFile.size,
            reducedSize: blob.size,
            url: url,
            blob: blob
          };
          
          setResult(reducedImage);
          setProcessing(false);
          
          toast({
            title: "Image reduced",
            description: `File size reduced by ${Math.round((1 - blob.size/uploadedFile.size) * 100)}%.`,
            variant: "default"
          });
        },
        uploadedFile.type,
        quality / 100
      );
    };
    
    img.onerror = () => {
      clearInterval(progressInterval);
      setProcessing(false);
      toast({
        title: "Processing failed",
        description: "Failed to load image. Please try another file.",
        variant: "destructive"
      });
    };
    
    // Load image from file
    img.src = URL.createObjectURL(uploadedFile);
  };

  const handleDownload = () => {
    if (!result || !result.url) {
      toast({
        title: "No file to download",
        description: "Please process an image first.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `Downloading ${result.name}`,
      variant: "default"
    });
  };

  // Format file size to KB or MB
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Calculate percentage reduction
  const getReductionPercentage = () => {
    if (!result) return 0;
    return Math.round(((result.originalSize - result.reducedSize) / result.originalSize) * 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">File Size Reducer</h1>
          <p className="text-gray-400 mt-1">
            Reduce image file sizes while preserving visual quality
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <FileUpload 
            onFileSelect={handleFileSelect}
            acceptedFileTypes=".jpg,.jpeg,.png,.webp"
            label="Upload Image"
          />

          <div className="parameter-card space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="quality" className="text-sm font-medium">Quality: {quality}%</Label>
              </div>
              <Slider
                id="quality"
                min={30}
                max={95}
                value={[quality]}
                onValueChange={(value) => setQuality(value[0])}
              />
              <p className="text-xs text-gray-400">
                Lower quality = smaller file size
              </p>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={handleReduce}
            disabled={processing || !uploadedFile}
          >
            {processing ? 'Processing...' : 'Reduce File Size'}
          </Button>
          
          {processing && (
            <ProgressBar value={progress} label="Reducing file size" />
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-app-dark-accent border border-gray-800 rounded-md p-4">
            <h2 className="text-lg font-medium mb-2">About File Reducer</h2>
            <p className="text-gray-400 text-sm">
              This tool compresses images to reduce file sizes while maintaining an acceptable level 
              of visual quality. Ideal for:
            </p>
            <ul className="list-disc list-inside text-gray-400 text-sm mt-2 space-y-1">
              <li>Reducing file sizes for web uploads</li>
              <li>Meeting platform-specific file size limits</li>
              <li>Optimizing images for faster loading</li>
              <li>Saving storage space for large image collections</li>
            </ul>
          </div>

          {result && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Reduced Image</h2>
              
              <div className="bg-app-dark-accent border border-gray-700 rounded-lg overflow-hidden">
                <div className="aspect-video bg-black flex items-center justify-center">
                  {result.url ? (
                    <img 
                      src={result.url} 
                      alt="Reduced preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-600" />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium mb-3">{result.name}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Original Size:</span>
                      <span>{formatFileSize(result.originalSize)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Reduced Size:</span>
                      <span className="text-app-blue font-medium">{formatFileSize(result.reducedSize)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Reduction:</span>
                      <span className="text-green-400">{getReductionPercentage()}%</span>
                    </div>
                  </div>
                  
                  <Button className="w-full" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Reduced Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileReducer;
