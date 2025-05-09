
import React from 'react';
import { Gauge, AlertCircle, CheckCircle, Info, Video } from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger, 
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

interface ComparisonResultProps {
  similarity: number;
  file1: File | null;
  file2: File | null;
  details: Record<string, any> | null;
  isLoading?: boolean;
}

const ComparisonResult: React.FC<ComparisonResultProps> = ({
  similarity,
  file1,
  file2,
  details,
  isLoading = false
}) => {
  // Format the metric value based on the type
  const formatMetricValue = (key: string, value: any): string => {
    if (typeof value === 'number') {
      // Format percentages
      if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('similarity')) {
        return `${value.toFixed(2)}%`;
      }
      // Format ratios
      if (key.toLowerCase().includes('ratio')) {
        return value.toFixed(3);
      }
      // Default number format
      return value.toFixed(2);
    }
    return String(value);
  };

  // Get color class based on similarity value
  const getSimilarityColor = (value: number): string => {
    if (value < 30) return "text-red-400";
    if (value < 60) return "text-amber-400";
    if (value < 80) return "text-yellow-400";
    return "text-green-400";
  };

  // Get background color class based on similarity value
  const getSimilarityBgColor = (value: number): string => {
    if (value < 30) return "bg-red-900/20";
    if (value < 60) return "bg-amber-900/20";
    if (value < 80) return "bg-yellow-900/20";
    return "bg-green-900/20";
  };

  // Get message based on similarity value
  const getSimilarityMessage = (value: number): string => {
    if (value < 30) return "These files are significantly different";
    if (value < 60) return "These files have some similarities";
    if (value < 80) return "These files have substantial similarities";
    return "These files are nearly identical";
  };

  const getFileTypeIcon = (file: File | null) => {
    if (!file) return <Info className="h-5 w-5" />;
    
    if (file.type.startsWith('image/')) {
      return <img src="/placeholder.svg" className="h-5 w-5 rounded-sm" alt="Image" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-5 w-5" />;
    }
    
    return <Info className="h-5 w-5" />;
  };

  // Group metrics by category for better display
  const groupMetrics = () => {
    if (!details) return {};
    
    const groups: Record<string, Record<string, any>> = {
      'Visual Similarity': {},
      'Content Analysis': {},
      'Technical Details': {},
      'Other': {}
    };
    
    Object.entries(details).forEach(([key, value]) => {
      // Skip certain metadata fields
      if (key === 'note' || key === 'error' || key === 'originalResponse') return;
      
      if (key.includes('perceptual') || key.includes('ssim') || key.includes('color') || key.includes('pixel')) {
        groups['Visual Similarity'][key] = value;
      } else if (key.includes('frame') || key.includes('content') || key.includes('feature')) {
        groups['Content Analysis'][key] = value;
      } else if (key.includes('ratio') || key.includes('format') || key.includes('size') || key.includes('resolution')) {
        groups['Technical Details'][key] = value;
      } else {
        groups['Other'][key] = value;
      }
    });
    
    // Remove empty groups
    return Object.fromEntries(Object.entries(groups).filter(([_, values]) => Object.keys(values).length > 0));
  };
  
  // If loading, show progress indicator
  if (isLoading) {
    return (
      <div className="bg-app-dark rounded-lg border border-gray-800 p-6">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold">Analyzing Media Files</h3>
          <Progress value={undefined} className="h-2" />
          <p className="text-sm text-gray-400">
            Comparing media files using multiple analysis methods...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app-dark rounded-lg border border-gray-800 p-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-4">Similarity Analysis Result</h3>
        
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="flex items-center text-sm font-medium">
            {file1 && getFileTypeIcon(file1)}
            <span className="ml-2">{file1?.name || 'No file'}</span>
          </div>
          <div className="text-xl font-bold">VS</div>
          <div className="flex items-center text-sm font-medium">
            {file2 && getFileTypeIcon(file2)}
            <span className="ml-2">{file2?.name || 'No file'}</span>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="mx-auto w-36 h-36 relative flex items-center justify-center">
            <Gauge className="absolute w-32 h-32 opacity-10" />
            <div className={`text-5xl font-bold ${getSimilarityColor(similarity)}`}>
              {similarity.toFixed(1)}%
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">overall similarity</p>
        </div>
        
        <div className={`rounded-md p-3 mb-6 ${getSimilarityBgColor(similarity)}`}>
          <p className={getSimilarityColor(similarity)}>
            {getSimilarityMessage(similarity)}
          </p>
        </div>
        
        {details && Object.keys(details).length > 0 && (
          <Accordion type="single" collapsible className="w-full text-left">
            {Object.entries(groupMetrics()).map(([groupName, metrics], groupIndex) => (
              <AccordionItem key={groupIndex} value={`item-${groupIndex}`}>
                <AccordionTrigger className="text-sm font-medium">
                  {groupName}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(metrics).map(([key, value], index) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b border-gray-800">
                        <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-mono">{formatMetricValue(key, value)}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            
            {details.note && (
              <div className="mt-4 p-3 bg-app-dark-accent rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-400 mt-0.5" />
                  <p className="text-sm text-amber-400">{details.note}</p>
                </div>
              </div>
            )}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default ComparisonResult;
