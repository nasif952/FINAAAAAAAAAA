
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAnalysisResult } from './useAnalysisResult';
import { AnalysisResultLoading } from './AnalysisResultLoading';
import { AnalysisResultError } from './AnalysisResultError';
import { AnalysisResultHeader } from './AnalysisResultHeader';
import { AnalysisResultTabs } from './AnalysisResultTabs';

interface AnalysisResultProps {
  analysisId: string;
  onBack?: () => void;
}

export function AnalysisResult({ analysisId, onBack }: AnalysisResultProps) {
  const { analysis, loading, error } = useAnalysisResult(analysisId);

  if (loading) {
    return <AnalysisResultLoading />;
  }

  if (error) {
    return <AnalysisResultError type={error} onBack={onBack} />;
  }

  if (!analysis) {
    return <AnalysisResultError type="notFound" onBack={onBack} />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <AnalysisResultHeader 
          title={analysis.title}
          status={analysis.status}
          uploadDate={analysis.upload_date}
          overallScore={analysis.analysis.overallScore}
        />
      </CardHeader>
      <CardContent>
        <AnalysisResultTabs 
          analysis={analysis.analysis}
          onBack={onBack}
        />
      </CardContent>
    </Card>
  );
}
