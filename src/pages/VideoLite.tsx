
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUpload from '@/components/FileUpload';
import ProgressBar from '@/components/ProgressBar';
import { Check, Download, Play, Video } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const VideoLite = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [numCopies, setNumCopies] = useState(3);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const { toast } = useToast();

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
          
          // Mock results
          const mockResults = [];
          for (let i = 0; i < numCopies; i++) {
            mockResults.push(`${uploadedFile.name.split('.')[0]}_lite_${i+1}.mp4`);
          }
          setResults(mockResults);
          
          toast({
            title: "Processing complete",
            description: `Generated ${numCopies} video variants.`,
            variant: "default"
          });
          
          return 100;
        }
        return prev + (100 / (numCopies * 10));
      });
    }, 200);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Video Lite</h1>
          <p className="text-gray-400 mt-1">
            Quick video repurposing with automatic settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
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

          {!processing && progress === 100 && (
            <div className="mt-6 bg-green-900/20 border border-green-800 rounded-md p-3 flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-green-400">Processing completed successfully</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="bg-app-dark-accent border border-gray-800 rounded-md p-4 mb-6">
            <h2 className="text-lg font-medium mb-2">About Video Lite</h2>
            <p className="text-gray-400 text-sm">
              Video Lite uses predefined optimal settings to create multiple unique-looking versions 
              of your content with minimal effort. This tool automatically applies:
            </p>
            <ul className="list-disc list-inside text-gray-400 text-sm mt-2 space-y-1">
              <li>Subtle speed adjustments (0.9x - 1.1x)</li>
              <li>Minor trimming (start/end)</li>
              <li>Contrast and saturation variations</li>
              <li>Brightness adjustments</li>
            </ul>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Generated Videos</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((result, index) => (
                  <div key={index} className="bg-app-dark-accent border border-gray-700 rounded-lg overflow-hidden">
                    <div className="aspect-video bg-black flex items-center justify-center">
                      <Video className="h-12 w-12 text-gray-600" />
                    </div>
                    <div className="p-3">
                      <p className="font-medium truncate">{result}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Button variant="outline" size="sm" className="flex-1 mr-2">
                          <Play className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button>
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

export default VideoLite;
