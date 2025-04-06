import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileDropzone } from './FileDropzone';
import { UploadProgressButton } from './UploadProgressButton';
import { AuthRequiredMessage } from './AuthRequiredMessage';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export function UploadPitchDeck() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const {
    file,
    setFile,
    uploading,
    uploadProgress,
    analyzing,
    handleUpload
  } = useFileUpload();

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    // Listen for authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUploadClick = () => {
    handleUpload(isAuthenticated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full overflow-hidden border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-0">
          <motion.div 
            className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
              <FileDropzone 
                file={file} 
                setFile={setFile} 
                isProcessing={uploading || analyzing}
              />
              
              {file && (
                <motion.div 
                  className="flex space-x-3 mt-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <UploadProgressButton 
                    isUploading={uploading}
                    isAnalyzing={analyzing}
                    uploadProgress={uploadProgress}
                    onUploadClick={handleUploadClick}
                    disabled={!isAuthenticated}
                  />
                </motion.div>
              )}
              
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <AuthRequiredMessage />
                </motion.div>
              )}
            </div>
            
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-sm font-medium text-muted-foreground">Our AI analyzes your pitch deck for:</h3>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {["Structure", "Content", "Clarity", "Investor Appeal", "Market Analysis"].map((feature, index) => (
                  <motion.span 
                    key={feature}
                    className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + (index * 0.1) }}
                  >
                    {feature}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
