
import { useState } from 'react';
import { VideoPresetSettings } from '@/types/preset';
import { useToast } from "@/hooks/use-toast";
import { generateProcessingParameters, processVideoOnServer } from '@/utils/videoProcessing';

export const useVideoProcessing = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{name: string, url: string, processingDetails?: any}[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  // We consider FFmpeg always loaded since we're now using Railway
  const ffmpegLoaded = true;
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    console.log("File selected:", file.name);
    
    // Reset states
    setProgress(0);
    setProcessing(false);
    setUploadedFile(file);
    setResults([]);
    setUploadProgress(0);
    
    try {
      // Set the uploaded file details
      setUploadedFile(file);
      setUploadedFileUrl(URL.createObjectURL(file));
      
      toast({
        title: "File ready",
        description: `${file.name} is ready for processing.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error handling file:', error);
      toast({
        title: "File error",
        description: error.message || "An error occurred while handling the file.",
        variant: "destructive"
      });
      
      // Reset the file selection
      setUploadedFile(null);
    }
  };

  const processVideo = async (
    numCopies: number,
    settings: VideoPresetSettings,
  ) => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a video file to continue.",
        variant: "destructive"
      });
      return;
    }

    console.log("Starting processing with Railway:", uploadedFile.name);
    setProcessing(true);
    setProgress(0);
    setResults([]);
    
    try {
      // Create formData for Railway request
      const formData = new FormData();
      formData.append('video', uploadedFile);
      formData.append('settings', JSON.stringify(settings));
      formData.append('numCopies', numCopies.toString());
      
      // Make a single request to Railway with all settings
      setProgress(20);
      
      try {
        const allResults: {name: string, url: string, processingDetails?: any}[] = [];

        for (let i = 0; i < numCopies; i++) {
          console.log(`Sending request to process-video endpoint (variation ${i + 1}/${numCopies})`);

          try {
            // Pass variation index to ensure unique parameters for each iteration
            const variationParams = generateProcessingParameters(settings, i);
            console.log(`Generated unique parameters for variation ${i + 1}:`, variationParams);
            
            // Use the enhanced processVideoOnServer function
            const result = await processVideoOnServer(uploadedFile, variationParams, settings);
            
            // Handle the result
            if (Array.isArray(result)) {
              allResults.push(...result);
            } else {
              const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              allResults.push({
                name: `processed_var${i + 1}_${uniqueId}_${uploadedFile.name}`,
                url: result.url,
                processingDetails: result.processingDetails || variationParams
              });
            }
          } catch (error) {
            console.error(`Error processing variation ${i + 1}:`, error);
            throw error;
          }


          setProgress(Math.round(((i + 1) / numCopies) * 100));
        }

        setResults(allResults);

        toast({
          title: "Processing complete",
          description: `Generated ${allResults.length} video variants.`,
          variant: "default"
        });

        return allResults;
      } catch (error) {
        // Handle specific cases of errors
        if (error.message && error.message.includes('Unexpected token')) {
          console.error('JSON parsing error:', error);
          throw new Error('The server response is invalid. This may be due to server issues. Please try again later.');
        }

        throw error;
      }
    } catch (error) {
      console.error('Error processing video with Railway:', error);
      toast({
        title: "Processing failed",
        description: error.message || "An error occurred while processing the video.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  return {
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
  };
};
