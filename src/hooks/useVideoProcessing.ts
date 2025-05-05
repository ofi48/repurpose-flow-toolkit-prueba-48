
import { useState } from 'react';
import { VideoPresetSettings } from '@/types/preset';
import { useToast } from "@/hooks/use-toast";
import { generateProcessingParameters, processVideoOnServer } from '@/utils/videoProcessing';
import { uploadFileWithProgress } from "@/integrations/supabase/client";

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
        console.log("Sending request to process-video endpoint");
        
        // Send request to process-video endpoint which forwards to Railway
        const response = await fetch('/process-video', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        setProgress(80);
        
        // Log response status and headers for debugging
        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers));
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log("Response content-type:", contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('Non-JSON response received:', textResponse.substring(0, 500));
          throw new Error(`Server returned an unexpected response format. Content-Type: ${contentType || 'undefined'}\n${textResponse.substring(0, 200)}`);
        }
        
        let responseData;
        try {
          responseData = await response.json();
          console.log("Response data:", JSON.stringify(responseData).substring(0, 200));
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          throw new Error('Failed to parse server response as JSON. The server might be returning invalid JSON.');
        }
        
        if (!response.ok) {
          const errorMsg = responseData.error || "Processing failed";
          console.error('Server returned error:', errorMsg);
          throw new Error(errorMsg);
        }
        
        // Update the progress to 100%
        setProgress(100);
        
        // Set the results
        if (responseData.results && Array.isArray(responseData.results)) {
          const processedVideos = responseData.results.map(result => ({
            name: result.name,
            url: result.url.startsWith('http') ? result.url : `https://video-server-production-d7af.up.railway.app${result.url}`,
            processingDetails: result.processingDetails
          }));
          
          setResults(processedVideos);
          
          toast({
            title: "Processing complete",
            description: `Generated ${processedVideos.length} video variants.`,
            variant: "default"
          });
          
          return processedVideos;
        } else {
          toast({
            title: "Processing complete",
            description: "Video processing completed successfully.",
            variant: "default"
          });
          return [];
        }
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
