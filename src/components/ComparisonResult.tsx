
import React from 'react';
import { Gauge, AlertCircle, CheckCircle, Info, Video, Image as ImageIcon } from 'lucide-react';
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
        return `${value.toFixed(1)}%`;
      }
      // Format difference values
      if (key.toLowerCase().includes('difference')) {
        return `${value.toFixed(1)}%`;
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
    // Special case for identical files
    if (details?.identicalFiles) {
      return "These files are 100% identical";
    }
    
    if (value < 30) return "These files have significantly different visual patterns";
    if (value < 60) return "These files have somewhat similar visual patterns";
    if (value < 80) return "These files have very similar visual patterns";
    return "These files have nearly identical visual patterns";
  };

  const getFileTypeIcon = (file: File | null) => {
    if (!file) return <Info className="h-5 w-5" />;
    
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-5 w-5" />;
    }
    
    return <Info className="h-5 w-5" />;
  };

  // Group metrics by category for better display
  const groupMetrics = () => {
    if (!details) return {};
    
    const groups: Record<string, Record<string, any>> = {
      'Visual Similarity Metrics': {},
      'Technical Details': {},
      'File Information': {},
      'Other': {}
    };
    
    // Get comparison breakdown if available
    const breakdown = details.comparison_breakdown || {};
    if (breakdown) {
      if (breakdown.perceptual_hash_similarity !== undefined) {
        groups['Visual Similarity Metrics']['Perceptual Hash Similarity'] = breakdown.perceptual_hash_similarity;
      }
      if (breakdown.ssim_score !== undefined) {
        groups['Visual Similarity Metrics']['Structural Similarity (SSIM)'] = breakdown.ssim_score;
      }
      if (breakdown.average_brightness_difference !== undefined) {
        groups['Visual Similarity Metrics']['Average Brightness Difference'] = breakdown.average_brightness_difference;
      }
      if (breakdown.color_histogram_similarity !== undefined) {
        groups['Visual Similarity Metrics']['Color Histogram Similarity'] = breakdown.color_histogram_similarity;
      }
      if (breakdown.repeated_frame_score !== undefined && breakdown.repeated_frame_score !== null) {
        groups['Visual Similarity Metrics']['Repeated Frame Score'] = breakdown.repeated_frame_score;
      }
      if (breakdown.temporal_frame_similarity !== undefined && breakdown.temporal_frame_similarity !== null) {
        groups['Visual Similarity Metrics']['Temporal Frame Similarity'] = breakdown.temporal_frame_similarity;
      }
    }
    
    // Process other details
    Object.entries(details).forEach(([key, value]) => {
      // Skip certain metadata fields and already processed fields
      if (['note', 'error', 'identicalFiles', 'comparison_breakdown'].includes(key)) return;
      
      if (key === 'file1' || key === 'file2') {
        // Add file information to File Information group
        if (typeof value === 'object') {
          Object.entries(value).forEach(([fileKey, fileValue]) => {
            groups['File Information'][`${key} ${fileKey}`] = fileValue;
          });
        }
      } else if (key.includes('hash') || key.includes('hamming') || key.includes('distance')) {
        groups['Technical Details'][key] = value;
      } else if (key.includes('ratio') || key.includes('format') || key.includes('size') || key.includes('maxPossible')) {
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
          <h3 className="text-xl font-bold">Analyzing Visual Patterns</h3>
          <Progress value={undefined} className="h-2" />
          <p className="text-sm text-gray-400">
            Generating perceptual hash signatures and comparing visual patterns...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app-dark rounded-lg border border-gray-800 p-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-4">Visual Similarity Analysis</h3>
        
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
        
        {details?.identicalFiles && (
          <div className="mb-4 p-3 bg-green-900/20 rounded-md">
            <div className="flex items-center justify-center text-green-400">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Files are identical at the binary level</span>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="mx-auto w-36 h-36 relative flex items-center justify-center">
            <Gauge className="absolute w-32 h-32 opacity-10" />
            <div className={`text-5xl font-bold ${getSimilarityColor(similarity)}`}>
              {similarity.toFixed(1)}%
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">overall visual similarity</p>
        </div>
        
        <div className={`rounded-md p-3 mb-6 ${getSimilarityBgColor(similarity)}`}>
          <p className={getSimilarityColor(similarity)}>
            {getSimilarityMessage(similarity)}
          </p>
        </div>
        
        {/* Show breakdown metrics as progress bars */}
        {details?.comparison_breakdown && (
          <div className="mb-6 space-y-4 max-w-md mx-auto">
            <h4 className="text-lg font-medium mb-3">Similarity Metrics</h4>
            
            {details.comparison_breakdown.perceptual_hash_similarity !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Perceptual Hash</span>
                  <span className={getSimilarityColor(details.comparison_breakdown.perceptual_hash_similarity)}>
                    {details.comparison_breakdown.perceptual_hash_similarity.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={details.comparison_breakdown.perceptual_hash_similarity} 
                  className="h-2" 
                />
              </div>
            )}
            
            {details.comparison_breakdown.ssim_score !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Structural Similarity</span>
                  <span className={getSimilarityColor(details.comparison_breakdown.ssim_score)}>
                    {details.comparison_breakdown.ssim_score.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={details.comparison_breakdown.ssim_score} 
                  className="h-2" 
                />
              </div>
            )}
            
            {details.comparison_breakdown.average_brightness_difference !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Brightness Difference</span>
                  <span className={getSimilarityColor(100 - details.comparison_breakdown.average_brightness_difference)}>
                    {details.comparison_breakdown.average_brightness_difference.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={100 - details.comparison_breakdown.average_brightness_difference} 
                  className="h-2" 
                />
                <p className="text-xs text-gray-400 mt-1">Lower is better (less difference)</p>
              </div>
            )}
            
            {details.comparison_breakdown.color_histogram_similarity !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Color Distribution</span>
                  <span className={getSimilarityColor(details.comparison_breakdown.color_histogram_similarity)}>
                    {details.comparison_breakdown.color_histogram_similarity.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={details.comparison_breakdown.color_histogram_similarity} 
                  className="h-2" 
                />
              </div>
            )}
            
            {details.comparison_breakdown.repeated_frame_score !== undefined && 
             details.comparison_breakdown.repeated_frame_score !== null && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Repeated Frames</span>
                  <span className={getSimilarityColor(details.comparison_breakdown.repeated_frame_score)}>
                    {details.comparison_breakdown.repeated_frame_score.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={details.comparison_breakdown.repeated_frame_score} 
                  className="h-2" 
                />
              </div>
            )}
            
            {details.comparison_breakdown.temporal_frame_similarity !== undefined && 
             details.comparison_breakdown.temporal_frame_similarity !== null && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Temporal Similarity</span>
                  <span className={getSimilarityColor(details.comparison_breakdown.temporal_frame_similarity)}>
                    {details.comparison_breakdown.temporal_frame_similarity.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={details.comparison_breakdown.temporal_frame_similarity} 
                  className="h-2" 
                />
              </div>
            )}
          </div>
        )}
        
        {details && Object.keys(details).length > 0 && (
          <Accordion type="single" collapsible className="w-full text-left mt-4">
            {Object.entries(groupMetrics()).map(([groupName, metrics], groupIndex) => (
              <AccordionItem key={groupIndex} value={`item-${groupIndex}`}>
                <AccordionTrigger className="text-sm font-medium">
                  {groupName}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(metrics).map(([key, value], index) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b border-gray-800">
                        <span className="text-gray-300">{key}</span>
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
