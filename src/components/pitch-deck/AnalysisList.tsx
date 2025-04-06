import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnalysisListTable } from './AnalysisListTable';
import { AnalysisListLoading } from './AnalysisListLoading';
import { AnalysisListEmpty } from './AnalysisListEmpty';
import { motion } from 'framer-motion';
import { BarChart3, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Analysis {
  id: string;
  title: string;
  status: string;
  upload_date: string;
  overall_score: number | null;
}

export function AnalysisList() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const { data, error } = await supabase
          .from('pitch_deck_analyses')
          .select('id, title, status, upload_date, analysis')
          .order('upload_date', { ascending: false });
        
        if (error) throw error;
        
        const formattedData = data.map(item => ({
          id: item.id,
          title: item.title || 'Untitled Analysis',
          status: item.status || 'unknown',
          upload_date: item.upload_date,
          overall_score: item.analysis && typeof item.analysis === 'object' ? 
            (item.analysis as { overallScore?: number }).overallScore || null : 
            null,
        }));
        
        setAnalyses(formattedData);
      } catch (error) {
        console.error('Error fetching analyses:', error);
        toast({
          title: "Error",
          description: "Failed to load analysis records.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyses();
  }, [toast]);

  // Function to simulate exporting data to CSV
  const handleExportCSV = () => {
    toast({
      title: "Export started",
      description: "Exporting analysis records to CSV...",
    });
    
    // This would be replaced with actual CSV export logic
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: "Analysis records have been exported.",
      });
    }, 1500);
  };

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-2">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-b">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Previous Analyses</CardTitle>
              <CardDescription>View and manage your pitch deck analysis history</CardDescription>
            </div>
          </div>
          {analyses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4" />
                <span>Export as CSV</span>
              </Button>
            </motion.div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AnalysisListLoading />
            </motion.div>
          ) : analyses.length === 0 ? (
            <motion.div
              variants={fadeInUpVariants}
              initial="hidden"
              animate="visible"
            >
              <AnalysisListEmpty />
            </motion.div>
          ) : (
            <motion.div
              variants={fadeInUpVariants}
              initial="hidden"
              animate="visible"
            >
              <AnalysisListTable analyses={analyses} />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {analyses.length > 0 && (
        <motion.div 
          className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring" }}
        >
          <FileText className="h-8 w-8 text-primary/60" />
          <div>
            <h3 className="font-medium">Analysis Insights</h3>
            <p className="text-sm text-muted-foreground">
              Your most recent analyses show an average score of {analyses.length > 0 ? 
                (analyses.reduce((acc, item) => acc + (item.overall_score || 0), 0) / analyses.filter(a => a.overall_score !== null).length).toFixed(1) : 
                'N/A'}/10. 
              Click on any analysis to view detailed feedback.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
