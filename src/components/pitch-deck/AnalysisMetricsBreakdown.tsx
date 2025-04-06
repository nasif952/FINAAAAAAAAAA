
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Metric {
  score: number;
  feedback: string;
}

interface AnalysisMetricsBreakdownProps {
  metrics: {
    [key: string]: Metric;
  };
}

export function AnalysisMetricsBreakdown({ metrics }: AnalysisMetricsBreakdownProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatMetricName = (name: string) => {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Breakdown</CardTitle>
        <CardDescription>Detailed scores for different aspects of your pitch deck</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(metrics).map(([key, metric]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{formatMetricName(key)}</span>
                <span className={`font-bold ${getScoreColor(metric.score)}`}>
                  {metric.score}/10
                </span>
              </div>
              <Progress 
                value={metric.score * 10} 
                className={getProgressColor(metric.score)}
              />
              <p className="text-sm text-muted-foreground mt-1">{metric.feedback}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
