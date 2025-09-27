import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Download, 
  Trash2, 
  RotateCcw, 
  Eye, 
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { ImageQueueItem } from '@/hooks/useImageQueue';

interface ImageQueueProps {
  queue: ImageQueueItem[];
  isProcessing: boolean;
  currentItem: string | null;
  onProcessQueue: () => void;
  onRemoveItem: (id: string) => void;
  onRetryItem: (id: string) => void;
  onClearQueue: () => void;
  onPreview: (fileName: string, fileUrl: string) => void;
  onDownload: (fileName: string, fileUrl: string) => void;
  onDownloadAll: () => void;
}

const getStatusColor = (status: ImageQueueItem['status']) => {
  switch (status) {
    case 'waiting': return 'default';
    case 'processing': return 'secondary';
    case 'completed': return 'default';
    case 'error': return 'destructive';
    default: return 'default';
  }
};

const getStatusIcon = (status: ImageQueueItem['status'], isCurrentItem: boolean) => {
  if (isCurrentItem && status === 'processing') {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  
  switch (status) {
    case 'waiting': return <Clock className="h-4 w-4" />;
    case 'processing': return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getStatusText = (status: ImageQueueItem['status']) => {
  switch (status) {
    case 'waiting': return 'Waiting';
    case 'processing': return 'Processing';
    case 'completed': return 'Completed';
    case 'error': return 'Error';
    default: return 'Unknown';
  }
};

const ImageQueue: React.FC<ImageQueueProps> = ({
  queue,
  isProcessing,
  currentItem,
  onProcessQueue,
  onRemoveItem,
  onRetryItem,
  onClearQueue,
  onPreview,
  onDownload,
  onDownloadAll
}) => {
  const totalItems = queue.length;
  const waitingItems = queue.filter(item => item.status === 'waiting').length;
  const completedItems = queue.filter(item => item.status === 'completed').length;
  const errorItems = queue.filter(item => item.status === 'error').length;

  const handleDownloadAllProcessed = () => {
    const completedItemsWithResults = queue.filter(item => 
      item.status === 'completed' && item.results && item.results.length > 0
    );
    
    if (completedItemsWithResults.length === 0) return;

    onDownloadAll();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Processing Queue
            </CardTitle>
            <CardDescription>
              Manage and process your image queue
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={onProcessQueue}
              disabled={isProcessing || waitingItems === 0}
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Process Queue
            </Button>
            <Button 
              onClick={handleDownloadAllProcessed}
              disabled={completedItems === 0}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
            <Button 
              onClick={onClearQueue}
              disabled={isProcessing}
              variant="outline"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
        
        {totalItems > 0 && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {totalItems}</span>
            <span>Waiting: {waitingItems}</span>
            <span>Completed: {completedItems}</span>
            {errorItems > 0 && <span>Errors: {errorItems}</span>}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {queue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No images in queue</p>
            <p className="text-sm">Add images to start batch processing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(item.status, currentItem === item.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {(item.fileSize / (1024 * 1024)).toFixed(2)} MB • 
                        {item.numCopies} variant{item.numCopies !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {item.status === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetryItem(item.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {item.status === 'completed' && item.results && item.results.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPreview(item.results![0].name, item.results![0].url)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            item.results!.forEach((result, idx) => {
                              setTimeout(() => {
                                onDownload(result.name, result.url);
                              }, idx * 100);
                            });
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      disabled={currentItem === item.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {item.status === 'processing' && (
                  <Progress value={item.progress} className="w-full" />
                )}

                {item.status === 'error' && item.error && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                    Error: {item.error}
                  </div>
                )}

                {item.status === 'completed' && item.results && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✓ Generated {item.results.length} variant{item.results.length !== 1 ? 's' : ''}
                  </div>
                )}

                {index < queue.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageQueue;