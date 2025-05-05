
import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes: string;
  maxSize?: number; // in MB
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  acceptedFileTypes, 
  maxSize = 100, 
  label = "Upload File" 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    const fileType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const validTypes = acceptedFileTypes.split(',').map(type => type.trim());
    
    // Check both MIME type and file extension
    const isValidType = validTypes.some(type => {
      // Remove asterisk for matching
      const cleanType = type.replace('*', '').replace('.', '');
      return fileType.includes(cleanType) || cleanType === fileExtension;
    });
    
    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: `Please upload ${acceptedFileTypes} files only.`,
        variant: "destructive"
      });
      return false;
    }
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size should not exceed ${maxSize}MB.`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  }, [acceptedFileTypes, maxSize, toast]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect, validateFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect, validateFile]);

  return (
    <div
      className={`file-upload-area ${isDragging ? 'border-app-blue bg-app-dark-accent' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        {selectedFile ? (
          <div className="space-y-2">
            <div className="text-app-blue">
              <Upload size={36} className="mx-auto" />
            </div>
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-gray-400">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Click or drag to replace
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              <Upload size={36} className="mx-auto" />
            </div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-gray-400">
              Click or drag and drop
            </p>
            <p className="text-xs text-gray-400">
              Max size: {maxSize}MB
            </p>
          </div>
        )}
      </label>
    </div>
  );
};

export default FileUpload;
