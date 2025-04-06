import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface FileDropzoneProps {
  file: File | null;
  setFile: (file: File | null) => void;
  isProcessing: boolean;
}

export function FileDropzone({ file, setFile, isProcessing }: FileDropzoneProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };
  
  const validateAndSetFile = (selectedFile: File) => {
    // Check if file is a PDF
    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
  };
  
  return (
    <AnimatePresence mode="wait">
      {file ? (
        <motion.div 
          className="flex flex-col items-center space-y-4 w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
          >
            <CheckCircle className="h-14 w-14 text-green-500" />
          </motion.div>
          <motion.div 
            className="text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-lg">{file.name}</p>
            </motion.div>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)}MB • PDF
            </p>
          </motion.div>
          <motion.div 
            className="flex space-x-3 mt-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              onClick={() => setFile(null)}
              disabled={isProcessing}
              className="transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              Change File
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          className="flex flex-col items-center space-y-6 w-full py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <motion.div 
            className={`p-5 rounded-full ${dragActive ? 'bg-primary/10 scale-110' : 'bg-muted'} transition-all duration-200`}
            animate={{ scale: dragActive ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Upload className={`h-10 w-10 ${dragActive ? 'text-primary' : 'text-muted-foreground'} transition-colors duration-200`} />
          </motion.div>
          <motion.div 
            className="text-center space-y-2 max-w-sm"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h3 
              className="font-semibold text-xl"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Upload your pitch deck
            </motion.h3>
            <motion.p 
              className="text-muted-foreground"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Drag and drop or click to browse your files
            </motion.p>
            <motion.p 
              className="text-xs text-muted-foreground bg-muted py-1 px-3 rounded-full inline-block"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              PDF format only (Max 10MB)
            </motion.p>
          </motion.div>
          <Input
            type="file"
            id="file-upload"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="px-8 border-primary/30 hover:border-primary/70 transition-colors duration-200"
            >
              <Upload className="mr-2 h-4 w-4" />
              Select File
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
