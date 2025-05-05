
import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface VideoPreviewProps {
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  currentPreview: string;
  currentPreviewUrl: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  showPreview,
  setShowPreview,
  currentPreview,
  currentPreviewUrl
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { toast } = useToast();

  return (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="mb-4">Video Preview</DialogTitle>
          <DialogClose />
        </DialogHeader>
        
        <div className="aspect-video bg-black rounded-md overflow-hidden">
          {currentPreviewUrl ? (
            <video 
              ref={videoRef}
              controls
              className="w-full h-full"
              src={currentPreviewUrl}
              onError={() => {
                toast({
                  title: "Video Error",
                  description: "Could not load the video. The file may be corrupted or not supported.",
                  variant: "destructive"
                });
              }}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No preview available</p>
            </div>
          )}
        </div>
        
        {currentPreview && (
          <div className="mt-2 text-center">
            <p className="text-sm font-medium">{currentPreview}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoPreview;
