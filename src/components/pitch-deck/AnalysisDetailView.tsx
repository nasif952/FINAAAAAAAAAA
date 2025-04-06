
import { Tab } from '@/components/pitch-deck/AnalysisResultTabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AnalysisStrengthsWeaknesses } from './AnalysisStrengthsWeaknesses';
import { XCircle, AlertCircle } from 'lucide-react';

interface AnalysisDetailViewProps {
  tab: 'strengths' | 'improvements';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export function AnalysisDetailView({ tab, strengths, weaknesses, recommendations }: AnalysisDetailViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {tab === 'strengths' ? 'Key Strengths' : 'Recommended Improvements'}
        </CardTitle>
        <CardDescription>
          {tab === 'strengths' 
            ? 'What your pitch deck does well' 
            : 'Actions you can take to enhance your pitch deck'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tab === 'strengths' ? (
          <ul className="space-y-4">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start p-4 bg-muted/50 rounded-lg">
                <XCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium">Strength {index + 1}</h4>
                  <p>{strength}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-6">
            <h3 className="font-semibold">Weaknesses to Address</h3>
            <ul className="space-y-4 mb-8">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start p-4 bg-muted/50 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">Weakness {index + 1}</h4>
                    <p>{weakness}</p>
                  </div>
                </li>
              ))}
            </ul>
            
            <h3 className="font-semibold">Specific Recommendations</h3>
            <ul className="space-y-4">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start p-4 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-blue-500 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">Recommendation {index + 1}</h4>
                    <p>{rec}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
