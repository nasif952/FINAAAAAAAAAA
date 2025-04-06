
import { Badge } from '@/components/ui/badge';

interface AnalysisResultHeaderProps {
  title: string;
  status: string;
  uploadDate: string;
  overallScore: number;
}

export function AnalysisResultHeader({ title, status, uploadDate, overallScore }: AnalysisResultHeaderProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };
  
  return (
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">Analyzed on {new Date(uploadDate).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center">
        <Badge variant={status === 'completed' ? 'default' : 'destructive'}>
          {status === 'completed' ? 'Complete' : 'Failed'}
        </Badge>
        <div className="ml-4 text-4xl font-bold flex items-center">
          <span className={getScoreColor(overallScore)}>
            {overallScore}/10
          </span>
        </div>
      </div>
    </div>
  );
}
