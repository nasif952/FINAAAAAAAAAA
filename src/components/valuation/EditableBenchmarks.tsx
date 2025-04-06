import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Save, X, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export interface BenchmarkItem {
  metric: string;
  value: number;
  label: string;
}

interface EditableBenchmarksProps {
  onBenchmarksChange?: () => void;
}

// Default benchmark values
const DEFAULT_BENCHMARKS: BenchmarkItem[] = [
  { metric: 'avg_revenue', value: 350000, label: 'Revenue' },
  { metric: 'avg_gross_margin', value: 65, label: 'Gross Margin' },
  { metric: 'avg_team_size', value: 15, label: 'Team Size' },
  { metric: 'avg_valuation', value: 1500000, label: 'Valuation' },
  { metric: 'avg_growth_rate', value: 25, label: 'Growth Rate' },
  { metric: 'avg_cash_on_hand', value: 150000, label: 'Cash on Hand' },
  { metric: 'avg_annual_roi', value: 20, label: 'Annual ROI' },
  { metric: 'avg_market_size', value: 5000000, label: 'Market Size' },
  { metric: 'product_readiness', value: 100, label: 'Product Readiness' }
];

export function EditableBenchmarks({ onBenchmarksChange }: EditableBenchmarksProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>(DEFAULT_BENCHMARKS);

  // Load custom benchmarks on mount
  useEffect(() => {
    loadUserBenchmarks();
  }, []);

  const loadUserBenchmarks = async () => {
    setIsLoading(true);
    try {
      // Load from local storage only
      const storedBenchmarks = localStorage.getItem('user_benchmarks');
      if (storedBenchmarks) {
        const parsedBenchmarks = JSON.parse(storedBenchmarks);
        // Update benchmarks from local storage
        setBenchmarks(prev => 
          prev.map(b => {
            const storedValue = parsedBenchmarks[b.metric];
            return storedValue !== undefined ? { ...b, value: storedValue } : b;
          })
        );
        console.log("Loaded user benchmarks from localStorage");
      }

      // Supabase table might not exist, so skip that for now
      // If we need to implement this later, we can uncomment this block
      /*
      try {
        const { data: userBenchmarks, error } = await supabase
          .from('user_benchmarks')
          .select('*');
        
        if (error) {
          console.log('User benchmarks table might not exist yet:', error);
          return; // Just use local storage values
        }
        
        if (userBenchmarks && userBenchmarks.length > 0) {
          // Update our benchmarks with custom values
          const updatedBenchmarks = benchmarks.map(b => {
            const customBenchmark = userBenchmarks.find(ub => ub.metric === b.metric);
            return customBenchmark 
              ? { ...b, value: customBenchmark.value } 
              : b;
          });
          setBenchmarks(updatedBenchmarks);
        }
      } catch (supabaseError) {
        console.log('Could not fetch from Supabase, using local storage:', supabaseError);
      }
      */
    } catch (error) {
      console.error('Error loading benchmarks:', error);
      toast({
        title: 'Using default benchmarks',
        description: 'Could not load custom benchmarks.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveBenchmarks = async () => {
    setIsLoading(true);
    try {
      // Save to local storage only for now
      const benchmarkValues = benchmarks.reduce((acc, b) => {
        acc[b.metric] = b.value;
        return acc;
      }, {} as Record<string, number>);
      
      localStorage.setItem('user_benchmarks', JSON.stringify(benchmarkValues));
      console.log("Saved user benchmarks to localStorage");

      // Skip the Supabase save since the table might not exist
      // If we need to implement this later, we can uncomment this block
      /*
      try {
        // Convert benchmarks to format needed for database
        const benchmarksToSave = benchmarks.map(b => ({
          metric: b.metric,
          value: b.value
        }));

        // Try to delete existing user benchmarks first
        const { error: deleteError } = await supabase
          .from('user_benchmarks')
          .delete()
          .neq('metric', 'dummy_placeholder');
        
        // If deletion fails, the table might not exist
        if (deleteError) {
          console.log('User benchmarks table might not exist yet:', deleteError);
        } else {
          // Try to insert new benchmarks
          const { error: insertError } = await supabase
            .from('user_benchmarks')
            .insert(benchmarksToSave);

          if (insertError) {
            console.log('Could not save benchmarks to Supabase:', insertError);
          }
        }
      } catch (supabaseError) {
        console.log('Could not save to Supabase, using local storage only:', supabaseError);
      }
      */

      toast({
        title: 'Benchmarks saved',
        description: 'Your custom benchmark values have been saved to local storage.'
      });
      
      setIsEditing(false);
      
      // Notify parent component that benchmarks have changed
      if (onBenchmarksChange) {
        onBenchmarksChange();
      }
    } catch (error) {
      console.error('Error saving benchmarks:', error);
      toast({
        title: 'Error saving benchmarks',
        description: 'Could not save your custom benchmarks.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = async () => {
    setIsLoading(true);
    try {
      // Remove from local storage
      localStorage.removeItem('user_benchmarks');
      console.log("Reset user benchmarks in localStorage");
      
      // Skip the Supabase reset since the table might not exist
      // If we need to implement this later, we can uncomment this block
      /*
      try {
        const { error } = await supabase
          .from('user_benchmarks')
          .delete()
          .neq('metric', 'dummy_placeholder');
        
        if (error) {
          console.log('Could not reset benchmarks in Supabase:', error);
        }
      } catch (supabaseError) {
        console.log('Could not reset in Supabase, using local storage only:', supabaseError);
      }
      */
      
      // Reset benchmarks to default values
      setBenchmarks(DEFAULT_BENCHMARKS);
      
      toast({
        title: 'Benchmarks reset',
        description: 'Benchmark values have been reset to defaults in local storage.'
      });
      
      // Notify parent component that benchmarks have changed
      if (onBenchmarksChange) {
        onBenchmarksChange();
      }
    } catch (error) {
      console.error('Error resetting benchmarks:', error);
      toast({
        title: 'Error resetting benchmarks',
        description: 'Could not reset benchmark values.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBenchmarkChange = (metric: string, value: number) => {
    setBenchmarks(prev => 
      prev.map(b => 
        b.metric === metric
          ? { ...b, value }
          : b
      )
    );
  };

  const formatValue = (metric: string, value: number) => {
    if (metric === 'avg_revenue' || metric === 'avg_valuation' || 
        metric === 'avg_cash_on_hand' || metric === 'avg_market_size') {
      return formatCurrency(value);
    } else if (metric === 'avg_gross_margin' || metric === 'avg_growth_rate' || 
              metric === 'avg_annual_roi') {
      return `${value}%`;
    } else {
      return value.toString();
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold">Benchmark Values</h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(false)}
                iconLeft={<X size={16} />}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={saveBenchmarks}
                iconLeft={isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                isLoading={isLoading}
              >
                Save Benchmarks
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
              iconLeft={<Edit size={16} />}
            >
              Edit Benchmarks
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              Customize benchmark values to better fit your industry or target goals.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benchmarks.map((benchmark) => (
                <div key={benchmark.metric} className="space-y-2">
                  <label className="text-sm font-medium">
                    {benchmark.label}
                  </label>
                  <Input
                    type="number"
                    value={benchmark.value}
                    onChange={(e) => handleBenchmarkChange(
                      benchmark.metric, 
                      parseFloat(e.target.value) || 0
                    )}
                    min={0}
                    step={
                      benchmark.metric.includes('margin') || 
                      benchmark.metric.includes('growth') || 
                      benchmark.metric.includes('roi')
                        ? 1
                        : benchmark.metric.includes('revenue') || 
                          benchmark.metric.includes('valuation') || 
                          benchmark.metric.includes('cash') || 
                          benchmark.metric.includes('market')
                          ? 1000
                          : 1
                    }
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={resetToDefaults}
                iconLeft={isLoading ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                isLoading={isLoading}
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              These benchmark values are used to calculate your startup's score.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {benchmarks.map((benchmark) => (
                <div key={benchmark.metric} className="border border-border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">{benchmark.label}</p>
                  <p className="font-medium">{formatValue(benchmark.metric, benchmark.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 