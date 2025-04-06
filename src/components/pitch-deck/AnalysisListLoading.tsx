
import { Loader2 } from 'lucide-react';

export function AnalysisListLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
      <p className="text-muted-foreground">Loading analyses...</p>
    </div>
  );
}
