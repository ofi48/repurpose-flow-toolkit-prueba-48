import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  X, 
  RotateCcw,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { QueueItem } from '@/hooks/useVideoQueue';

interface VideoQueueProps {
  queue: QueueItem[];
  isProcessing: boolean;
  currentItem: string | null;
  onProcessQueue: () => void;
  onRemoveItem: (id: string) => void;
  onRetryItem: (id: string) => void;
  onClearQueue: () => void;
  onPreview?: (fileName: string, fileUrl: string) => void;
  onDownload?: (fileName: string, fileUrl: string) => void;
}

const getStatusColor = (status: QueueItem['status']) => {
  switch (status) {
    case 'waiting': return 'secondary';
    case 'processing': return 'default';
    case 'completed': return 'default';
    case 'error': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusIcon = (status: QueueItem['status'], isCurrentItem: boolean) => {
  switch (status) {
    case 'waiting': 
      return <Clock className="h-4 w-4" />;
    case 'processing': 
      return <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
    case 'completed': 
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error': 
      return <AlertCircle className="h-4 w-4" />;
    default: 
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusText = (status: QueueItem['status']) => {
  switch (status) {
    case 'waiting': return 'Waiting';
    case 'processing': return 'Processing';
    case 'completed': return 'Completed';
    case 'error': return 'Error';
    default: return 'Unknown';
  }
};

const VideoQueue: React.FC<VideoQueueProps> = ({
  queue,
  isProcessing,
  currentItem,
  onProcessQueue,
  onRemoveItem,
  onRetryItem,
  onClearQueue,
  onPreview,
  onDownload
}) => {
  const waitingCount = queue.filter(item => item.status === 'waiting').length;
  const completedCount = queue.filter(item => item.status === 'completed').length;
  const errorCount = queue.filter(item => item.status === 'error').length;

  if (queue.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No videos in queue</p>
            <p className="text-sm">Upload videos to start processing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Processing Queue</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={onProcessQueue}
              disabled={isProcessing || waitingCount === 0}
              size="sm"
              className="h-8"
            >
              <Play className="h-4 w-4 mr-1" />
              {isProcessing ? 'Processing...' : 'Process Queue'}
            </Button>
            <Button
              variant="outline"
              onClick={onClearQueue}
              disabled={isProcessing}
              size="sm"
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: {queue.length}</span>
          <span>Waiting: {waitingCount}</span>
          <span>Completed: {completedCount}</span>
          {errorCount > 0 && <span className="text-destructive">Errors: {errorCount}</span>}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {queue.map((item) => (
          <div 
            key={item.id}
            className={`
              p-3 border rounded-lg transition-colors
              ${item.id === currentItem ? 'border-primary bg-primary/5' : 'border-border'}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status, item.id === currentItem)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(item.status)} className="text-xs">
                  {getStatusText(item.status)}
                </Badge>
                
                {item.status === 'waiting' && !isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                
                {item.status === 'error' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRetryItem(item.id)}
                    className="h-6 w-6 p-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {item.status === 'processing' && (
              <Progress value={item.progress} className="h-2 mb-2" />
            )}

            {item.status === 'error' && item.error && (
              <p className="text-xs text-destructive mt-1 p-2 bg-destructive/5 rounded">
                {item.error}
              </p>
            )}

            {item.status === 'completed' && item.results && item.results.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {item.results.length} variation{item.results.length > 1 ? 's' : ''} generated
                  </p>
                  <div className="flex gap-1">
                    {onPreview && item.results[0] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview(item.results![0].name, item.results![0].url)}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    )}
                    {onDownload && item.results[0] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(item.results![0].name, item.results![0].url)}
                        className="h-6 px-2 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default VideoQueue;