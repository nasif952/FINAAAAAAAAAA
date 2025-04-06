
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AnalysisStrengthsWeaknesses } from './AnalysisStrengthsWeaknesses';
import { AnalysisRecommendations } from './AnalysisRecommendations';

interface AnalysisOverviewProps {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export function AnalysisOverview({ strengths, weaknesses, recommendations }: AnalysisOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnalysisStrengthsWeaknesses type="strengths" items={strengths} />
        <AnalysisStrengthsWeaknesses type="weaknesses" items={weaknesses} />
      </div>
      
      <AnalysisRecommendations recommendations={recommendations} />
    </div>
  );
}
