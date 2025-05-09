
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Video, Image as ImageIcon, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MediaComparisonCard from "@/components/MediaComparisonCard";
import ComparisonResult from "@/components/ComparisonResult";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

const Detector = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [similarityResult, setSimilarityResult] = useState<number | null>(null);
  const [comparisonDetails, setComparisonDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const { toast } = useToast();

  const handleFileChange = (newFile: File | null, fileNum: 1 | 2) => {
    if (fileNum === 1) {
      setFile1(newFile);
    } else {
      setFile2(newFile);
    }
    
    // Reset results when files change
    setSimilarityResult(null);
    setComparisonDetails(null);
  };

  const compareFiles = async () => {
    if (!file1 || !file2) {
      toast({
        title: "Files required",
        description: "Please select two files to compare.",
        variant: "destructive"
      });
      return;
    }

    // Check file types - allow image and video comparisons
    const isFile1Media = file1.type.startsWith('image/') || file1.type.startsWith('video/');
    const isFile2Media = file2.type.startsWith('image/') || file2.type.startsWith('video/');

    if (!isFile1Media || !isFile2Media) {
      toast({
        title: "Unsupported file type",
        description: "Please select image or video files for comparison.",
        variant: "destructive"
      });
      return;
    }

    setIsComparing(true);
    setProgress(0);
    
    try {
      // Start the progress animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      // Create form data to send to the processing server
      const formData = new FormData();
      formData.append('file1', file1);
      formData.append('file2', file2);
      
      console.log("Sending media comparison request via Supabase edge function");
      
      // Use the Supabase edge function to securely forward the request
      let response;
      try {
        response = await supabase.functions.invoke('compare-files', {
          body: formData,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        console.log("Supabase edge function response:", response);
        
        // Error handling for Supabase edge function response
        if (response.error) {
          throw new Error(response.error.message || 'Error from edge function');
        }
        
        if (!response.data) {
          throw new Error('No data returned from edge function');
        }
        
        // Handle the response from the edge function
        const data = response.data;
        
        // Clear the progress interval
        clearInterval(progressInterval);
        
        // Process the similarity score from the response
        if (data.similarity !== undefined) {
          console.log("Received similarity score:", data.similarity);
          
          // Store any additional details that might be returned
          setComparisonDetails(data.details || null);
          setProgress(100);
          setSimilarityResult(data.similarity);
          
          // Switch to results tab
          setActiveTab("results");
          
          toast({
            title: "Comparison complete",
            description: `Files are ${data.similarity.toFixed(1)}% similar.`,
          });
        } else {
          console.log("No similarity score returned, using fallback");
          
          toast({
            title: "Comparison partially failed",
            description: "Could not calculate exact similarity. Using estimated value.",
            variant: "warning"
          });
          
          // Provide a fallback or estimated result 
          setSimilarityResult(50); // Default to 50% as fallback
          setComparisonDetails({ 
            note: "This is an estimated value. Exact comparison failed.",
            error: data.error || "Unknown error"
          });
          setProgress(100);
          
          // Switch to results tab
          setActiveTab("results");
        }
      } catch (error) {
        console.error("Error invoking Supabase edge function:", error);
        throw error;
      }
    } catch (error) {
      console.error('Error checking similarity:', error);
      toast({
        title: "Comparison failed",
        description: error.message || "An error occurred while comparing files. Please try again.",
        variant: "destructive"
      });
      
      // Set progress back to 0
      setProgress(0);
      setSimilarityResult(null);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Advanced Media Similarity Detector</h1>
          <p className="text-gray-400 mt-1">
            Compare images and videos using multiple analysis methods
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-app-dark-accent rounded-lg border border-gray-800 p-6 mb-8">
          <div className="flex justify-center mb-4">
            <FileText className="h-8 w-8 text-app-blue" />
          </div>
          <p className="text-gray-300 text-center mb-4">
            This advanced media detector analyzes files using multiple comparison techniques:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div className="space-y-2">
              <p className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-app-blue mr-2"></span>
                Perceptual Hashes
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-app-blue mr-2"></span>
                Structural Similarity Index
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-app-blue mr-2"></span>
                Color Histogram Analysis
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-app-blue mr-2"></span>
                Aspect Ratio Comparison
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-app-blue mr-2"></span>
                Compression Analysis
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-app-blue mr-2"></span>
                Frame Analysis (Videos)
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="results" disabled={similarityResult === null}>View Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <MediaComparisonCard 
                file={file1}
                fileNum={1}
                onFileChange={handleFileChange}
              />
              
              <MediaComparisonCard 
                file={file2}
                fileNum={2}
                onFileChange={handleFileChange}
              />
            </div>

            <div className="flex justify-center mt-8">
              <Button 
                size="lg"
                onClick={compareFiles}
                disabled={!file1 || !file2 || isComparing}
                className="px-8"
              >
                {isComparing ? 'Comparing Files...' : 'Compare Files'}
              </Button>
            </div>

            {isComparing && (
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2 text-center">
                  Analyzing file similarity using multiple methods...
                </p>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="results">
            {similarityResult !== null && (
              <ComparisonResult 
                similarity={similarityResult}
                file1={file1}
                file2={file2}
                details={comparisonDetails}
              />
            )}
            
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline"
                onClick={() => setActiveTab("upload")}
              >
                Back to Upload
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Detector;
