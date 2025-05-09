
import React, { useState } from 'react';
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
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setResult(null);
    setResultUrl(null);
  };

  const handleConvert = () => {
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
    
    // Simulate processing - in a real app, this would call an API
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          
          // Create a mock result
          const resultName = `${uploadedFile.name.split('.')[0]}.gif`;
          setResult(resultName);
          
          // For demonstration, we'll create a URL that can be used for download
          // In a real app, this would be the URL to the converted GIF
          // Since we're mocking, we'll create a blob with minimal content
          const blob = new Blob(["GIF89a"], { type: 'image/gif' });
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          
          toast({
            title: "Conversion complete",
            description: "Your GIF has been created successfully.",
            variant: "default"
          });
          
          return 100;
        }
        return prev + 2;
      });
    }, 100);
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
