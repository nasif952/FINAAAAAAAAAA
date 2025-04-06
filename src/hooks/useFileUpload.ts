
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUpload = async (isAuthenticated: boolean) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Generate unique storage path using the imported uuid function
      const filePath = `${uuidv4()}-${file.name.replace(/\s+/g, '_')}`;
      
      // Upload file to storage
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('pitch-decks')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (storageError) {
        throw new Error(storageError.message);
      }

      // Create file record in the database
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          name: file.name,
          storage_path: filePath,
          file_type: 'application/pdf',
          file_size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          owner: 'Current User' // In a real app, use authenticated user's information
        })
        .select()
        .single();

      if (fileError) {
        throw new Error(fileError.message);
      }

      toast({
        title: "Upload successful",
        description: "Your pitch deck has been uploaded successfully.",
      });

      // Start analysis
      setUploading(false);
      setAnalyzing(true);

      try {
        // Call the Supabase edge function with proper error handling
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-pitch-deck', {
          body: { fileId: fileData.id },
        });
        
        if (analysisError) {
          console.error('Analysis error details:', analysisError);
          throw new Error(analysisError.message || 'Failed to analyze pitch deck');
        }
        
        if (!analysisData || !analysisData.analysis || !analysisData.analysis.id) {
          throw new Error('Invalid response from analysis function');
        }

        toast({
          title: "Analysis complete",
          description: "Your pitch deck has been analyzed successfully.",
        });
        
        // Redirect to analysis results page
        navigate(`/pitch-deck-analysis/${analysisData.analysis.id}`);
      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        toast({
          title: "Analysis failed",
          description: analysisError instanceof Error ? analysisError.message : "Failed to analyze the pitch deck",
          variant: "destructive",
        });
        // Even if analysis fails, don't prevent the user from seeing previous analyses
        navigate('/pitch-deck-analysis');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return {
    file,
    setFile,
    uploading,
    uploadProgress,
    analyzing,
    handleUpload
  };
}
