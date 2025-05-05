
import React from 'react';
import { Button } from "@/components/ui/button";
import { Video, Play, Download } from 'lucide-react';

interface VideoCardProps {
  result: {
    name: string;
    url: string;
    processingDetails?: {
      speed?: number;
      saturation?: number;
      contrast?: number;
      brightness?: number;
      flipHorizontal?: boolean;
    };
  };
  onPreview: (name: string, url: string) => void;
  onDownload: (name: string, url: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ result, onPreview, onDownload }) => {
  return (
    <div className="bg-app-dark-accent border border-gray-700 rounded-lg overflow-hidden">
      <div className="aspect-video bg-black flex items-center justify-center relative">
        <Video className="h-12 w-12 text-gray-600 absolute" />
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-xs p-2 text-white space-y-1">
          {result.processingDetails && (
            <>
              {result.processingDetails.speed && (
                <p>Speed: {result.processingDetails.speed.toFixed(2)}x</p>
              )}
              {result.processingDetails.saturation && (
                <p>Saturation: {result.processingDetails.saturation.toFixed(2)}</p>
              )}
              {result.processingDetails.contrast && (
                <p>Contrast: {result.processingDetails.contrast.toFixed(2)}</p>
              )}
              {result.processingDetails.brightness && (
                <p>Brightness: {result.processingDetails.brightness.toFixed(2)}</p>
              )}
              {result.processingDetails.flipHorizontal && (
                <p>Flipped: {result.processingDetails.flipHorizontal ? 'Yes' : 'No'}</p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium truncate">{result.name}</p>
        <div className="flex items-center justify-between mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 mr-2"
            onClick={() => onPreview(result.name, result.url)}
          >
            <Play className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onDownload(result.name, result.url)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
