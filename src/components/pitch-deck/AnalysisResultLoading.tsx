
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function AnalysisResultLoading() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Loading Analysis...</CardTitle>
        <CardDescription>Please wait while we load your pitch deck analysis</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">This may take a minute...</p>
        </div>
      </CardContent>
    </Card>
  );
}
