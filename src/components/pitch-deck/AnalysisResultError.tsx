
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { XCircle, AlertTriangle, AlertCircle } from 'lucide-react';

interface AnalysisResultErrorProps {
  type: 'notFound' | 'failed' | 'incomplete';
  onBack?: () => void;
}

export function AnalysisResultError({ type, onBack }: AnalysisResultErrorProps) {
  const getErrorContent = () => {
    switch (type) {
      case 'notFound':
        return {
          title: 'Analysis Not Found',
          description: 'We couldn\'t find the analysis you\'re looking for',
          icon: <XCircle className="h-16 w-16 text-destructive mb-4" />,
          message: 'The analysis may have been deleted or the ID is incorrect.',
        };
      case 'failed':
        return {
          title: 'Analysis Failed',
          description: 'There was a problem analyzing your pitch deck',
          icon: <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />,
          message: 'The analysis process encountered an error. Please try uploading your pitch deck again.',
        };
      case 'incomplete':
        return {
          title: 'Incomplete Analysis',
          description: 'The analysis results are incomplete',
          icon: <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />,
          message: 'The analysis results appear to be incomplete. Please try uploading your pitch deck again.',
        };
    }
  };

  const content = getErrorContent();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          {content.icon}
          <p>{content.message}</p>
          {onBack && (
            <button 
              onClick={onBack}
              className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Go Back
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
