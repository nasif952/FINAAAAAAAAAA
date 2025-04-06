import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadPitchDeck } from '@/components/pitch-deck/UploadPitchDeck';
import { AnalysisList } from '@/components/pitch-deck/AnalysisList';
import { AnalysisResult } from '@/components/pitch-deck/AnalysisResult';
import { ArrowLeft, Upload, BarChart3, Shield, FileText, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function PitchDeckAnalysis() {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("upload");
  
  // Listen for errors from the edge function
  useEffect(() => {
    const errorParams = new URLSearchParams(window.location.search);
    const errorMessage = errorParams.get('error');
    
    if (errorMessage) {
      toast({
        title: "Analysis failed",
        description: errorMessage || "An error occurred during analysis",
        variant: "destructive",
      });
      
      // Clean the URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [toast]);

  // Redirect unauthenticated users after auth check completes
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to access pitch deck analysis",
        variant: "destructive",
      });
      navigate('/auth', { state: { from: '/pitch-deck-analysis' } });
    }
  }, [user, loading, navigate, toast]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-[60vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <motion.p 
          className="mt-4 text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Loading analysis tools...
        </motion.p>
      </motion.div>
    );
  }

  // If not authenticated, don't render content
  if (!user) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-[60vh] space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Shield className="h-16 w-16 text-muted-foreground" />
        </motion.div>
        <motion.h2 
          className="text-xl font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Authentication Required
        </motion.h2>
        <motion.p 
          className="text-muted-foreground text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Please log in to access advanced pitch deck analysis powered by AI
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <Button 
            onClick={() => navigate('/auth', { state: { from: '/pitch-deck-analysis' } })}
            className="px-6"
            size="lg"
          >
            Log In
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  if (analysisId) {
    return (
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="flex items-center"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/pitch-deck-analysis')}
            className="mr-4 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:translate-x-[-2px] transition-transform duration-200" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold mb-2">Pitch Deck Analysis</h1>
            <p className="text-muted-foreground">Detailed results of your pitch deck analysis</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <AnalysisResult 
            analysisId={analysisId} 
            onBack={() => navigate('/pitch-deck-analysis')}
          />
        </motion.div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <motion.div className="flex items-center space-x-2 mb-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pitch Deck Analysis</h1>
        </motion.div>
        <motion.div 
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Zap className="h-4 w-4 text-amber-500" />
          <p className="text-muted-foreground">Upload and analyze your pitch deck with AI</p>
        </motion.div>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-8"
        >
          <TabsList className="grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger value="upload" className="flex items-center gap-2 px-6">
              <Upload className="h-4 w-4" />
              <span>Upload New</span>
            </TabsTrigger>
            <TabsTrigger value="previous" className="flex items-center gap-2 px-6">
              <BarChart3 className="h-4 w-4" />
              <span>Previous Analyses</span>
            </TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            {activeTab === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <TabsContent value="upload" forceMount>
                  <UploadPitchDeck />
                </TabsContent>
              </motion.div>
            )}
            
            {activeTab === "previous" && (
              <motion.div
                key="previous"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <TabsContent value="previous" forceMount>
                  <AnalysisList />
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
