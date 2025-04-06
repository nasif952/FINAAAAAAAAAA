
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface AnalysisStrengthsWeaknessesProps {
  type: 'strengths' | 'weaknesses';
  items: string[];
}

export function AnalysisStrengthsWeaknesses({ type, items }: AnalysisStrengthsWeaknessesProps) {
  const isStrengths = type === 'strengths';
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {isStrengths ? 'Key Strengths' : 'Areas to Improve'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start">
              {isStrengths ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 shrink-0" />
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
