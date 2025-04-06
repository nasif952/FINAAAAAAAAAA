
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function AuthRequiredMessage() {
  return (
    <Alert variant="destructive" className="mt-4 animate-fade-in">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Authentication Required</AlertTitle>
      <AlertDescription>
        Please log in to upload and analyze pitch decks.
      </AlertDescription>
    </Alert>
  );
}
