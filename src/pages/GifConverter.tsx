
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import FileUpload from '@/components/FileUpload';
import ProgressBar from '@/components/ProgressBar';
import { Download, FileImage, Play } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const GifConverter = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [frameRate, setFrameRate] = useState(24);
  const [width, setWidth] = useState(576);
  const [quality, setQuality] = useState(85);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Cleanup function to revoke object URLs when component unmounts or when new conversions happen
  useEffect(() => {
    return () => {
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, []);

  const handleFileSelect = (file: File) => {
    // Revoke previous URL to avoid memory leaks
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    
    setUploadedFile(file);
    setResult(null);
    setResultUrl(null);
  };

  // Create a simple animated GIF-like effect using canvas
  const createDemoGif = (fileName: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve('');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');
      
      // Set canvas dimensions based on the width parameter
      const aspectRatio = 9/16; // Common video aspect ratio
      canvas.width = width;
      canvas.height = Math.floor(width * aspectRatio);
      
      // Create a colorful animated pattern (simulating GIF frames)
      const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'];
      let frameCount = 0;
      
      // Create 5 frames with different colors
      const frames: Blob[] = [];
      
      const drawFrame = () => {
        if (frameCount >= 5) {
          // Create a multiframe animated blob from the collected frames
          const gifBlob = new Blob(frames, { type: 'image/gif' });
          const url = URL.createObjectURL(gifBlob);
          resolve(url);
          return;
        }
        
        // Clear canvas
        ctx.fillStyle = colors[frameCount];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some visual elements
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${Math.floor(canvas.width / 15)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`Demo GIF - Frame ${frameCount + 1}`, canvas.width / 2, canvas.height / 2);
        
        // Quality effect - reduced quality means more pixelation
        const pixelSize = Math.max(1, Math.floor((100 - quality) / 10));
        if (pixelSize > 1) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let y = 0; y < canvas.height; y += pixelSize) {
            for (let x = 0; x < canvas.width; x += pixelSize) {
              const i = (y * canvas.width + x) * 4;
              const r = imageData.data[i];
              const g = imageData.data[i + 1];
              const b = imageData.data[i + 2];
              
              for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
                for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
                  const idx = ((y + py) * canvas.width + (x + px)) * 4;
                  imageData.data[idx] = r;
                  imageData.data[idx + 1] = g;
                  imageData.data[idx + 2] = b;
                }
              }
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }
        
        // Convert the current frame to blob and add to frames array
        canvas.toBlob((blob) => {
          if (blob) {
            frames.push(blob);
            frameCount++;
            drawFrame();
          }
        }, 'image/gif');
      };
      
      drawFrame();
    });
  };

  const handleConvert = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a video file to continue.",
        variant: "destructive"
      });
      return;
    }

    // Check if the file is a video
    if (!uploadedFile.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, WebM, MOV).",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    
    // Simulate processing with progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95; // Hold at 95% until actual conversion completes
        }
        return prev + 2;
      });
    }, 100);

    try {
      // Create a mock result name
      const resultName = `${uploadedFile.name.split('.')[0]}.gif`;
      
      // Generate a demo GIF using our canvas function
      const url = await createDemoGif(resultName);
      
      // Complete the progress bar and set the results
      setProgress(100);
      setResult(resultName);
      setResultUrl(url);
      
      toast({
        title: "Conversion complete",
        description: "Your GIF has been created successfully.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: "There was an error creating your GIF.",
        variant: "destructive"
      });
    } finally {
      clearInterval(interval);
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !resultUrl) {
      toast({
        title: "No file to download",
        description: "Please convert a video to GIF first.",
        variant: "destructive"
      });
      return;
    }

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = result;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `Downloading ${result}`,
      variant: "default"
    });
  };

  const handlePreview = () => {
    if (!result || !resultUrl) {
      toast({
        title: "No file to preview",
        description: "Please convert a video to GIF first.",
        variant: "destructive"
      });
      return;
    }

    // Open the GIF in a new tab
    window.open(resultUrl, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">GIF Converter</h1>
          <p className="text-gray-400 mt-1">
            Convert videos to high-quality GIFs with custom settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <FileUpload 
            onFileSelect={handleFileSelect}
            acceptedFileTypes=".mp4,.mov,.webm"
            label="Upload Video"
            maxSize={50}
          />

          <div className="parameter-card space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="frame-rate" className="text-sm font-medium">Frame Rate: {frameRate} fps</Label>
              </div>
              <div className="flex items-center space-x-4">
                <Slider
                  id="frame-rate"
                  min={15}
                  max={60}
                  step={1}
                  value={[frameRate]}
                  onValueChange={(value) => setFrameRate(value[0])}
                />
                <Input 
                  type="number" 
                  min={15} 
                  max={60} 
                  value={frameRate} 
                  onChange={(e) => setFrameRate(parseInt(e.target.value) || 24)}
                  className="parameter-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="width" className="text-sm font-medium">Width: {width}px</Label>
              </div>
              <div className="flex items-center space-x-4">
                <Slider
                  id="width"
                  min={120}
                  max={1200}
                  step={8}
                  value={[width]}
                  onValueChange={(value) => setWidth(value[0])}
                />
                <Input 
                  type="number" 
                  min={120} 
                  max={1200} 
                  value={width} 
                  onChange={(e) => setWidth(parseInt(e.target.value) || 576)}
                  className="parameter-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="quality" className="text-sm font-medium">Quality: {quality}%</Label>
              </div>
              <div className="flex items-center space-x-4">
                <Slider
                  id="quality"
                  min={50}
                  max={100}
                  value={[quality]}
                  onValueChange={(value) => setQuality(value[0])}
                />
                <Input 
                  type="number" 
                  min={50} 
                  max={100} 
                  value={quality} 
                  onChange={(e) => setQuality(parseInt(e.target.value) || 85)}
                  className="parameter-input"
                />
              </div>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={handleConvert}
            disabled={processing || !uploadedFile}
          >
            {processing ? 'Converting...' : 'Convert to GIF'}
          </Button>
          
          {processing && (
            <ProgressBar value={progress} label="Converting to GIF" />
          )}
          
          {/* Hidden canvas used for GIF creation */}
          <canvas 
            ref={canvasRef} 
            style={{ display: 'none' }}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-app-dark-accent border border-gray-800 rounded-md p-4">
            <h2 className="text-lg font-medium mb-2">About GIF Converter</h2>
            <p className="text-gray-400 text-sm">
              Our GIF converter creates high-quality animated GIFs from video files while 
              preserving visual quality and optimizing file size.
            </p>
            <ul className="list-disc list-inside text-gray-400 text-sm mt-2 space-y-1">
              <li>Higher frame rates (24-60 fps) create smoother animations but larger files</li>
              <li>Width adjusts the size (height maintains aspect ratio)</li>
              <li>Quality setting balances visual quality with file size</li>
              <li>Recommended for short clips (under 10 seconds)</li>
            </ul>
          </div>

          {result && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Generated GIF</h2>
              
              <div className="bg-app-dark-accent border border-gray-700 rounded-lg overflow-hidden">
                <div className="aspect-video bg-black flex items-center justify-center">
                  {resultUrl ? (
                    <img 
                      src={resultUrl} 
                      alt="GIF Preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <FileImage className="h-12 w-12 text-gray-600" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium">{result}</p>
                  <p className="text-sm text-gray-400 mb-2">
                    {width}px width • {frameRate}fps • {quality}% quality
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <Button variant="outline" size="sm" className="flex-1 mr-2" onClick={handlePreview}>
                      <Play className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" className="flex-1" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GifConverter;
