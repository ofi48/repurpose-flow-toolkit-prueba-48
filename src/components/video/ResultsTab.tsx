
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from 'lucide-react';
import VideoCard from './VideoCard';
import { GlobalResult } from '@/hooks/useGlobalResults';

interface ResultsTabProps {
  results: GlobalResult[];
  handlePreview: (fileName: string, fileUrl: string) => void;
  handleDownload: (fileName: string, fileUrl: string) => void;
  handleDownloadAll: () => void;
  handleClearResults: () => void;
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  results,
  handlePreview,
  handleDownload,
  handleDownloadAll,
  handleClearResults
}) => {
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.source]) {
      acc[result.source] = [];
    }
    acc[result.source].push(result);
    return acc;
  }, {} as Record<string, GlobalResult[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">All Video Results</h2>
        {results.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearResults}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <Button onClick={handleDownloadAll}>
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          </div>
        )}
      </div>
      
      {results.length === 0 ? (
        <div className="bg-card border rounded-md p-8 text-center">
          <p className="text-muted-foreground">No results yet. Process videos to see results here.</p>
          <p className="text-sm text-muted-foreground mt-2">All processed videos from single and batch processing will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedResults).map(([source, sourceResults]) => (
            <div key={source} className="space-y-4">
              <h3 className="text-lg font-medium capitalize border-b pb-2">
                {source === 'single' ? 'Single Processing' : 'Batch Processing'} 
                <span className="text-sm text-muted-foreground ml-2">({sourceResults.length} videos)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sourceResults.map((result) => (
                  <VideoCard
                    key={result.id}
                    result={result}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            </div>
          ))}
          
          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Total: {results.length} video variants generated
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTab;
