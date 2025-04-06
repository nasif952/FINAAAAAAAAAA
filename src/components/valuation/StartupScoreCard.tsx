
import { Card } from '@/components/Card';
import { useStartupScore } from '@/hooks/useStartupScore';
import { Button } from '@/components/Button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { StartupScore } from '@/integrations/supabase/client-extension';

export function StartupScoreCard() {
  const { latestScore, calculateScore, loading } = useStartupScore();
  const [calculating, setCalculating] = useState(false);
  const { toast } = useToast();
  
  const handleCalculateScore = async () => {
    setCalculating(true);
    try {
      const score = await calculateScore();
      if (score) {
        toast({
          title: "Score updated",
          description: `Your startup score is now ${score.totalScore}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error calculating score",
        description: "There was a problem calculating your startup score",
        variant: "destructive"
      });
    } finally {
      setCalculating(false);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return "Invalid date";
    }
  };
  
  return (
    <Card className="mb-6">
      <div className="p-4">
        <div className="flex flex-row items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Startup Score</h2>
            <p className="text-muted-foreground text-sm">
              {latestScore ? `Last calculated: ${formatDate(latestScore.calculation_date)}` : 'Not calculated yet'}
            </p>
          </div>
          
          <Button 
            onClick={handleCalculateScore}
            disabled={loading || calculating}
            className="flex items-center gap-2"
          >
            {(loading || calculating) ? 'Calculating...' : 'Recalculate Score'}
            <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-1">
            <span className="text-lg font-medium">Total Score</span>
            <span className="text-2xl font-bold">{latestScore ? latestScore.total_score : 0}</span>
          </div>
          <Progress value={latestScore ? latestScore.total_score : 0} max={100} className="h-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Financial Health</span>
              <span className="font-medium">{latestScore ? latestScore.finance_score : 0}/100</span>
            </div>
            <Progress 
              value={latestScore ? latestScore.finance_score : 0} 
              max={100} 
              className="h-1.5 mb-4" 
            />
            
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Team & Organization</span>
              <span className="font-medium">{latestScore ? latestScore.team_score : 0}/100</span>
            </div>
            <Progress 
              value={latestScore ? latestScore.team_score : 0} 
              max={100} 
              className="h-1.5 mb-4" 
            />
            
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Growth Potential</span>
              <span className="font-medium">{latestScore ? latestScore.growth_score : 0}/100</span>
            </div>
            <Progress 
              value={latestScore ? latestScore.growth_score : 0} 
              max={100} 
              className="h-1.5" 
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Market Position</span>
              <span className="font-medium">{latestScore ? latestScore.market_score : 0}/100</span>
            </div>
            <Progress 
              value={latestScore ? latestScore.market_score : 0} 
              max={100} 
              className="h-1.5 mb-4" 
            />
            
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Product Maturity</span>
              <span className="font-medium">{latestScore ? latestScore.product_score : 0}/100</span>
            </div>
            <Progress 
              value={latestScore ? latestScore.product_score : 0} 
              max={100} 
              className="h-1.5 mb-4" 
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
