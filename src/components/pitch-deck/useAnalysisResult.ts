
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Metric {
  score: number;
  feedback: string;
}

interface AnalysisResult {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  metrics: {
    problemDefinition: Metric;
    solutionClarity: Metric;
    marketAnalysis: Metric;
    businessModel: Metric;
    teamQualifications: Metric;
    financialProjections: Metric;
    visualDesign: Metric;
  };
  recommendations: string[];
}

interface AnalysisData {
  id: string;
  title: string;
  status: string;
  upload_date: string;
  analysis: AnalysisResult;
}

// Function to validate if an object conforms to the AnalysisResult interface
function isValidAnalysisResult(obj: any): obj is AnalysisResult {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.overallScore === 'number' &&
    Array.isArray(obj.strengths) &&
    Array.isArray(obj.weaknesses) &&
    typeof obj.metrics === 'object' &&
    Array.isArray(obj.recommendations)
  );
}

export function useAnalysisResult(analysisId: string) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'notFound' | 'failed' | 'incomplete' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data, error } = await supabase
          .from('pitch_deck_analyses')
          .select('*')
          .eq('id', analysisId)
          .single();
        
        if (error) {
          console.error('Error fetching analysis from Supabase:', error);
          setError('notFound');
          return;
        }
        
        if (!data) {
          setError('notFound');
          return;
        }

        if (data.status === 'failed') {
          setError('failed');
          setAnalysis({
            id: data.id,
            title: data.title || 'Untitled Analysis',
            status: data.status,
            upload_date: data.upload_date,
            analysis: {} as AnalysisResult
          });
          return;
        }

        let parsedAnalysis: AnalysisResult;
        
        // Handle string format (JSON string)
        if (typeof data.analysis === 'string') {
          try {
            const parsed = JSON.parse(data.analysis);
            if (!isValidAnalysisResult(parsed)) {
              setError('incomplete');
              return;
            }
            parsedAnalysis = parsed;
          } catch (parseError) {
            console.error('Error parsing analysis JSON:', parseError);
            setError('incomplete');
            return;
          }
        } 
        // Handle object format
        else if (data.analysis && typeof data.analysis === 'object') {
          // First cast to unknown, then check if it's a valid AnalysisResult
          const analysisObj = data.analysis as unknown;
          
          if (!isValidAnalysisResult(analysisObj)) {
            console.error('Analysis object does not match expected structure:', data.analysis);
            setError('incomplete');
            return;
          }
          
          parsedAnalysis = analysisObj;
        } 
        // Handle any other unexpected format
        else {
          console.error('Unexpected analysis data type:', typeof data.analysis);
          setError('incomplete');
          return;
        }

        const analysisData: AnalysisData = {
          id: data.id,
          title: data.title || 'Untitled Analysis',
          status: data.status,
          upload_date: data.upload_date,
          analysis: parsedAnalysis
        };
        
        setAnalysis(analysisData);
        setError(null);
      } catch (error) {
        console.error('Error fetching analysis:', error);
        toast({
          title: "Error",
          description: "Failed to load analysis results.",
          variant: "destructive",
        });
        setError('notFound');
      } finally {
        setLoading(false);
      }
    };

    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId, toast]);

  return { analysis, loading, error };
}
