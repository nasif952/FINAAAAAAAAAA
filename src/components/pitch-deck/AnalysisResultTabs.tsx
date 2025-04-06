
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisOverview } from './AnalysisOverview';
import { AnalysisMetricsBreakdown } from './AnalysisMetricsBreakdown';
import { AnalysisDetailView } from './AnalysisDetailView';

interface Metric {
  score: number;
  feedback: string;
}

interface AnalysisData {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  metrics: {
    [key: string]: Metric;
  };
  recommendations: string[];
}

export type Tab = 'overview' | 'metrics' | 'strengths' | 'improvements';

interface AnalysisResultTabsProps {
  analysis: AnalysisData;
  onBack?: () => void;
}

export function AnalysisResultTabs({ analysis, onBack }: AnalysisResultTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="metrics">Score Breakdown</TabsTrigger>
        <TabsTrigger value="strengths">Strengths</TabsTrigger>
        <TabsTrigger value="improvements">Improvements</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <AnalysisOverview 
          strengths={analysis.strengths}
          weaknesses={analysis.weaknesses}
          recommendations={analysis.recommendations}
        />
      </TabsContent>
      
      <TabsContent value="metrics">
        <AnalysisMetricsBreakdown metrics={analysis.metrics} />
      </TabsContent>
      
      <TabsContent value="strengths">
        <AnalysisDetailView 
          tab="strengths"
          strengths={analysis.strengths}
          weaknesses={analysis.weaknesses}
          recommendations={analysis.recommendations}
        />
      </TabsContent>
      
      <TabsContent value="improvements">
        <AnalysisDetailView 
          tab="improvements"
          strengths={analysis.strengths}
          weaknesses={analysis.weaknesses}
          recommendations={analysis.recommendations}
        />
      </TabsContent>
      
      {onBack && (
        <div className="mt-6">
          <button 
            onClick={onBack}
            className="rounded bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
          >
            Back to All Analyses
          </button>
        </div>
      )}
    </Tabs>
  );
}
