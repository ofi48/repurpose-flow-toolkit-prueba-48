import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface MultiFileUploadProps {
  onFilesSelect: (files: File[]) => void;
  acceptedFileTypes: string;
  maxSize?: number; // in MB
  label?: string;
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({ 
  onFilesSelect, 
  acceptedFileTypes, 
  maxSize = 100, 
  label = "Subir Videos" 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
      const cleanType = type.replace('*', '').replace('.', '');
      return fileType.includes(cleanType) || cleanType === fileExtension;
    });
    
    if (!isValidType) {
      toast({
        title: "Tipo de archivo inválido",
        description: `Por favor sube solo archivos ${acceptedFileTypes}.`,
        variant: "destructive"
      });
      return false;
    }
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: `El archivo ${file.name} supera el límite de ${maxSize}MB.`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  }, [acceptedFileTypes, maxSize, toast]);

  const processFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList);
    const validFiles = files.filter(validateFile);
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      onFilesSelect(validFiles);
      
      toast({
        title: "Archivos añadidos",
        description: `${validFiles.length} video${validFiles.length > 1 ? 's' : ''} añadido${validFiles.length > 1 ? 's' : ''} correctamente.`,
        variant: "default"
      });
    }
  }, [validateFile, onFilesSelect, toast]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    e.target.value = '';
  }, [processFiles]);

  const removeFile = useCallback((indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  return (
    <div className="space-y-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-accent/30'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="multi-file-upload"
          className="hidden"
          accept={acceptedFileTypes}
          multiple
          onChange={handleFileChange}
        />
        <label htmlFor="multi-file-upload" className="cursor-pointer">
          <div className="space-y-2">
            <div className="text-primary">
              <Upload size={36} className="mx-auto" />
            </div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              Arrastra y suelta varios videos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground">
              Tamaño máximo: {maxSize}MB por archivo
            </p>
          </div>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Videos seleccionados ({selectedFiles.length})
            </h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAll}
              className="text-xs"
            >
              Limpiar todo
            </Button>
          </div>
          
          <div className="grid gap-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-card border rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiFileUpload;