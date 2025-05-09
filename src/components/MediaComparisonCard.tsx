
import React, { useState } from 'react';
import { Video, Image as ImageIcon, Info, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MediaComparisonCardProps {
  file: File | null;
  fileNum: 1 | 2;
  onFileChange: (file: File | null, fileNum: 1 | 2) => void;
  acceptedTypes?: string;
}

const MediaComparisonCard: React.FC<MediaComparisonCardProps> = ({
  file,
  fileNum,
  onFileChange,
  acceptedTypes = "image/*,video/*"
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Determine if a file is an image or video
  const getFileType = (file: File | null) => {
    if (!file) return null;
    
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type.startsWith('video/')) {
      return 'video';
    }
    
    return 'unknown';
  };

  // Get icon based on file type
  const getFileIcon = (file: File | null) => {
    const type = getFileType(file);
    
    if (type === 'image') {
      return <ImageIcon className="h-8 w-8" />;
    } else if (type === 'video') {
      return <Video className="h-8 w-8" />;
    }
    
    return <Info className="h-8 w-8" />;
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      onFileChange(selectedFile, fileNum);
      
      // Create preview URL for images and videos
      if (selectedFile) {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium mb-2">File {fileNum}</h2>
      <div 
        className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-app-blue transition-colors"
        onClick={() => document.getElementById(`file${fileNum}-input`)?.click()}
      >
        <input
          id={`file${fileNum}-input`}
          type="file"
          accept={acceptedTypes}
          className="hidden"
          onChange={handleFileUpload}
        />
        
        {file ? (
          <div className="space-y-2">
            <div className="flex justify-center text-app-blue">
              {getFileIcon(file)}
            </div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-400">
              {(file.size / (1024 * 1024)).toFixed(2)} MB • {getFileType(file)}
            </p>
            
            {previewUrl && (
              <div className="mt-4 flex justify-center">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-40 rounded-lg object-contain" 
                  />
                ) : file.type.startsWith('video/') ? (
                  <video 
                    src={previewUrl} 
                    controls 
                    className="max-h-40 rounded-lg object-contain"
                  />
                ) : null}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-2">
              Click to replace
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400 flex justify-center">
              {fileNum === 1 ? <ImageIcon className="h-8 w-8" /> : <Video className="h-8 w-8" />}
            </div>
            <p className="text-sm font-medium">Select File {fileNum}</p>
            <p className="text-xs text-gray-400">
              Click to upload an image or video
            </p>
            <div className="mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Info className="h-4 w-4 mr-2" /> 
                      Supported Types
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Images: jpg, jpeg, png, webp, gif</p>
                    <p>Videos: mp4, webm, mov</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaComparisonCard;
