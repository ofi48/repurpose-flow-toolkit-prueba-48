
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import VideoCard from './VideoCard';

interface ResultsTabProps {
  results: { name: string; url: string; processingDetails?: any }[];
  handlePreview: (fileName: string, fileUrl: string) => void;
  handleDownload: (fileName: string, fileUrl: string) => void;
  handleDownloadAll: () => void;
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  results,
  handlePreview,
  handleDownload,
  handleDownloadAll
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Generated Videos</h2>
      
      {results.length === 0 ? (
        <div className="bg-app-dark-accent border border-gray-700 rounded-md p-4 text-center">
          <p className="text-gray-400">No results yet. Process a video to generate results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result, index) => (
            <VideoCard
              key={index}
              result={result}
              onPreview={handlePreview}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-6">
          <div>
            <p className="text-sm text-gray-400">
              Generated {results.length} video variants
            </p>
          </div>
          <Button onClick={handleDownloadAll}>
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResultsTab;
