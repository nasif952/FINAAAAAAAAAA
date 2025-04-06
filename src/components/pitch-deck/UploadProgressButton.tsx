
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';

interface UploadProgressButtonProps {
  isUploading: boolean;
  isAnalyzing: boolean;
  uploadProgress: number;
  onUploadClick: () => void;
  disabled: boolean;
}

export function UploadProgressButton({
  isUploading,
  isAnalyzing,
  uploadProgress,
  onUploadClick,
  disabled
}: UploadProgressButtonProps) {
  if (isUploading) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Uploading {uploadProgress}%
      </Button>
    );
  }
  
  if (isAnalyzing) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Analyzing...
      </Button>
    );
  }
  
  return (
    <Button
      onClick={onUploadClick}
      disabled={disabled}
    >
      <Upload className="mr-2 h-4 w-4" />
      Upload & Analyze
    </Button>
  );
}
