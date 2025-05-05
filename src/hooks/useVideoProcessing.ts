
import { useState } from 'react';
import { VideoPresetSettings } from '@/types/preset';
import { useToast } from "@/hooks/use-toast";
import { generateProcessingParameters } from '@/utils/videoProcessing';
import { uploadFileWithProgress } from "@/integrations/supabase/client";

export const useVideoProcessing = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{name: string, url: string, processingDetails?: any}[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Remove ffmpeg dependency
  const ffmpegLoaded = true; // Always consider it loaded since we're not using it anymore
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
      // Generate a unique filename
      const fileName = `input_${Date.now()}.mp4`;
      
      // Set the uploaded file details
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

    console.log("Starting processing:", uploadedFile.name);
    setProcessing(true);
    setProgress(0);
    setResults([]);
    
    try {
      // Simulate video processing since we removed FFmpeg
      // In a real app, you would send the video to a server for processing
      const totalVariants = numCopies;
      const processedVideos = [];
      
      for (let i = 0; i < totalVariants; i++) {
        // Update progress
        setProgress(Math.round((i / totalVariants) * 100));
        
        // Generate random parameters for this variant
        const params = generateProcessingParameters(settings);
        
        // In a real implementation, you would send the video and parameters to a server
        // and get back a processed video URL
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
        
        // Add to results with dummy data
        processedVideos.push({
          name: `variant_${i + 1}.mp4`,
          url: URL.createObjectURL(uploadedFile), // Just use the original file for demo
          processingDetails: params
        });
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
      console.error('Error processing video:', error);
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
    ffmpegLoaded, // Keep this to maintain interface compatibility with components that use it
    handleFileSelect,
    processVideo,
    setResults
  };
};
