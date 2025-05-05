
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
      // Process videos using Railway server
      const processedVideos = [];
      const totalVariants = numCopies;
      
      for (let i = 0; i < totalVariants; i++) {
        // Update progress
        setProgress(Math.round((i / totalVariants) * 100));
        
        // Generate parameters for this variant
        const params = generateProcessingParameters(settings);
        
        // Process video using Railway server
        const processedVideo = await processVideoOnServer(uploadedFile, params);
        processedVideos.push(processedVideo);
        
        // Small delay between requests to avoid overwhelming the server
        if (i < totalVariants - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Update the progress to 100%
      setProgress(100);
      
      // Set the results
      setResults(processedVideos);
      
      toast({
        title: "Processing complete",
        description: `Generated ${processedVideos.length} video variants.`,
        variant: "default"
      });
      
      return processedVideos;
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
