
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/Card';
import { formatCurrency } from '@/lib/formatters';

interface ValuationHistory {
  id: string;
  selected_valuation: number | null;
  pre_money_valuation: number | null;
  investment: number | null;
  post_money_valuation: number | null;
  updated_at: string;
}

export function HistoryContent() {
  const { data: valuationHistory, isLoading } = useQuery({
    queryKey: ['valuation-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valuations')
        .select('id, selected_valuation, pre_money_valuation, investment, post_money_valuation, updated_at')
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching valuation history:", error);
        return [];
      }
      
      return data as ValuationHistory[];
    }
  });
  
  if (isLoading) {
    return <div className="p-4 text-center">Loading history...</div>;
  }
  
  if (!valuationHistory || valuationHistory.length === 0) {
    return (
      <div className="p-6 text-center animate-fade-in">
        <h2 className="text-xl font-medium mb-2">Valuation History</h2>
        <p className="text-muted-foreground">No valuation history available yet. Update your valuation to see history.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-4">Valuation History</h2>
      
      <div className="space-y-4">
        {valuationHistory.map((entry, index) => (
          <Card key={entry.id} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Valuation #{index + 1}</h3>
              <span className="text-sm text-muted-foreground">
                {new Date(entry.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-muted-foreground block">Pre-Money</span>
                <span className="font-semibold">{formatCurrency(entry.pre_money_valuation || 0)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Investment</span>
                <span className="font-semibold">{formatCurrency(entry.investment || 0)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Post-Money</span>
                <span className="font-semibold">{formatCurrency(entry.post_money_valuation || 0)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
