import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from 'lucide-react';
import { GlobalResult } from '@/hooks/useGlobalResults';

interface ImageResultsTabProps {
  results: GlobalResult[];
  onPreview: (fileName: string, fileUrl: string) => void;
  onDownload: (fileName: string, fileUrl: string) => void;
  onDownloadAll: () => void;
  onClearResults: () => void;
}

const ImageResultsTab: React.FC<ImageResultsTabProps> = ({
  results,
  onPreview,
  onDownload,
  onDownloadAll,
  onClearResults
}) => {
  // Group results by source
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.source]) {
      acc[result.source] = [];
    }
    acc[result.source].push(result);
    return acc;
  }, {} as Record<string, GlobalResult[]>);

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No images processed yet</p>
        <p className="text-sm">Process some images to see results here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Image Results</h2>
        <div className="flex gap-2">
          <Button onClick={onClearResults} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={onDownloadAll} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>

      {Object.entries(groupedResults).map(([source, sourceResults]) => (
        <div key={source} className="space-y-4">
          <h3 className="text-lg font-medium capitalize">
            {source === 'single' ? 'Single Processing' : 'Batch Processing'} Results
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sourceResults.map((result, index) => (
              <ImageCard
                key={`${source}-${index}`}
                result={result}
                onPreview={onPreview}
                onDownload={onDownload}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="border-t border-border pt-4">
        <p className="text-sm text-muted-foreground text-center">
          Total: {results.length} image variant{results.length !== 1 ? 's' : ''} generated
        </p>
      </div>
    </div>
  );
};

const ImageCard: React.FC<{
  result: GlobalResult;
  onPreview: (fileName: string, fileUrl: string) => void;
  onDownload: (fileName: string, fileUrl: string) => void;
}> = ({ result, onPreview, onDownload }) => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div 
        className="aspect-square bg-muted flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => onPreview(result.name, result.url)}
      >
        <img 
          src={result.url} 
          alt={result.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
          onError={(e) => {
            e.currentTarget.src = '';
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <div className="p-3">
        <p className="text-xs font-medium truncate mb-2">{result.name}</p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 text-xs h-8"
            onClick={() => onPreview(result.name, result.url)}
          >
            Preview
          </Button>
          <Button 
            size="sm" 
            className="flex-1 text-xs h-8"
            onClick={() => onDownload(result.name, result.url)}
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageResultsTab;