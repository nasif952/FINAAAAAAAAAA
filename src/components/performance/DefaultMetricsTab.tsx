import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, Plus, Info, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MetricItem {
  id: string;
  name: string;
  target: string;
  actual: string;
  unit: string;
}

// Function to get month name from month number (1-12)
const getMonthName = (month: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1];
};

// Mock API function to simulate saving metrics to a server
const saveMetricsToServer = async (data: any) => {
  console.log('Saving metrics to server:', data);
  
  // Actually save the metrics to the database
  const { month, year, metrics } = data;
  
  // For each metric, upsert a row in performance_metrics and performance_values
  for (const metric of metrics) {
    // First, ensure the metric exists in performance_metrics
    const { data: metricData, error: metricError } = await supabase
      .from('performance_metrics')
      .upsert({
        id: metric.id,
        name: metric.name,
        unit: metric.unit,
        is_default: true
      }, { onConflict: 'id' })
      .select('id')
      .single();
      
    if (metricError) {
      console.error('Error saving metric:', metricError);
      throw metricError;
    }
    
    // Then save the actual value
    const { error: valueError } = await supabase
      .from('performance_values')
      .upsert({
        metric_id: metricData.id,
        month: parseInt(month),
        year: parseInt(year),
        target: metric.target ? parseFloat(metric.target) : null,
        actual: metric.actual ? parseFloat(metric.actual) : null
      }, { onConflict: 'metric_id, month, year' });
      
    if (valueError) {
      console.error('Error saving metric value:', valueError);
      throw valueError;
    }
  }
  
  return { success: true };
};

// Mock API function to fetch saved metrics
const fetchSavedMetrics = async (month: number, year: number) => {
  console.log('Fetching metrics for', getMonthName(month), year);
  
  // First, get all default metrics
  const { data: metricsData, error: metricsError } = await supabase
    .from('performance_metrics')
    .select('*')
    .eq('is_default', true);
    
  if (metricsError) {
    console.error('Error fetching metrics:', metricsError);
    throw metricsError;
  }
  
  // Then get values for the specific month and year
  const { data: valuesData, error: valuesError } = await supabase
    .from('performance_values')
    .select('*, performance_metrics(*)')
    .eq('month', month)
    .eq('year', year);
    
  if (valuesError) {
    console.error('Error fetching values:', valuesError);
    throw valuesError;
  }
  
  // If we have values, return them, otherwise create default entries based on metricsData
  if (valuesData && valuesData.length > 0) {
    return valuesData.map(value => ({
      id: value.metric_id,
      name: value.performance_metrics.name,
      target: value.target?.toString() || '',
      actual: value.actual?.toString() || '',
      unit: value.performance_metrics.unit
    }));
  } else {
    // Create default entries if no data exists yet
    return metricsData.map(metric => ({
      id: metric.id,
      name: metric.name,
      target: '',
      actual: '',
      unit: metric.unit
    }));
  }
};

export function DefaultMetricsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkData, setBulkData] = useState('');

  // Add function to ensure default metrics exist
  useEffect(() => {
    const ensureDefaultMetricsExist = async () => {
      // Check if default metrics exist
      const { data: existingMetrics, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('is_default', true);
        
      if (error) {
        console.error('Error checking default metrics:', error);
        return;
      }
      
      // If no default metrics exist, create them
      if (!existingMetrics || existingMetrics.length === 0) {
        const defaultMetrics = [
          { name: 'Revenue', unit: '$', is_default: true },
          { name: 'Gross Margin', unit: '%', is_default: true },
          { name: 'Cash on Hand', unit: '$', is_default: true },
          { name: 'No. of Paying Customers', unit: '#', is_default: true }
        ];
        
        for (const metric of defaultMetrics) {
          await supabase.from('performance_metrics').insert(metric);
        }
        
        console.log('Default metrics created');
      }
    };
    
    ensureDefaultMetricsExist();
  }, []);

  // Query to fetch saved metrics
  const { data: savedMetrics, isLoading, isFetching, error } = useQuery({
    queryKey: ['metrics', selectedMonth, selectedYear],
    queryFn: () => fetchSavedMetrics(selectedMonth, selectedYear),
    enabled: !!selectedMonth && !!selectedYear,
    placeholderData: (prevData) => prevData,
    staleTime: 5 * 60 * 1000,
  });

  // Update local metrics state when fetched data changes
  useEffect(() => {
    if (savedMetrics) {
      setMetrics(savedMetrics);
    } else {
      setMetrics([]);
    }
  }, [savedMetrics]);

  const handleInputChange = (metricId: string, field: 'target' | 'actual', value: string) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setMetrics(metrics.map(metric => 
      metric.id === metricId ? { ...metric, [field]: sanitizedValue } : metric
    ));
  };
  
  // Mutation for saving metrics
  const saveMutation = useMutation({
    mutationFn: () => saveMetricsToServer({ month: selectedMonth, year: selectedYear, metrics }),
    onSuccess: () => {
      toast({ title: "Success", description: "Metrics saved successfully." });
      queryClient.invalidateQueries({ queryKey: ['metrics', selectedMonth, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['performance-history'] });
      queryClient.invalidateQueries({ queryKey: ['performance-metrics-latest'] });
    },
    onError: (err: any) => {
      toast({ title: "Error Saving Metrics", description: err.message || "An unknown error occurred.", variant: "destructive" });
    },
  });

  // --- Animation Variants ---
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 12 } },
    exit: { opacity: 0, x: -20 }
  };
  
  // Generate options (simplified)
  const monthOptions = Array.from({length: 12}, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4 !text-blue-800" /> 
          <AlertTitle className="font-semibold">Performance metrics vs. Valuation data</AlertTitle>
          <AlertDescription>
            These metrics track ongoing business performance. For valuation and benchmarking, the system prioritizes questionnaire responses.
             Ensure your questionnaire reflects your latest financial information for the most accurate valuation.
          </AlertDescription>
      </Alert>
      
      <Card className="shadow-sm">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
           <div className="space-y-1">
             <CardTitle className="text-lg font-medium">Default Metrics</CardTitle>
             <CardDescription>Update targets and actuals for the selected period.</CardDescription>
           </div>
            <div className="flex items-center space-x-2">
                {/* Month Selector */} 
               <Select 
                 value={selectedMonth.toString()} 
                 onValueChange={(value) => setSelectedMonth(parseInt(value))}
                 disabled={saveMutation.isPending}
                >
                 <SelectTrigger className="w-[140px]">
                   <SelectValue placeholder="Select Month" />
                 </SelectTrigger>
                 <SelectContent>
                   {monthOptions.map(option => (
                     <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               {/* Year Selector */} 
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                  disabled={saveMutation.isPending}
                >
                 <SelectTrigger className="w-[100px]">
                   <SelectValue placeholder="Select Year" />
                 </SelectTrigger>
                 <SelectContent>
                   {yearOptions.map(year => (
                     <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
                 {/* Add/Bulk Buttons (optional based on design) */} 
                 {/* <Button variant="outline" size="sm" disabled={saveMutation.isPending}><Plus className="mr-1 h-4 w-4" /> Add Metric</Button>
                 <Button variant="outline" size="sm" onClick={() => setIsBulkUploadOpen(true)} disabled={saveMutation.isPending}><FileUp className="mr-1 h-4 w-4" /> Bulk Upload</Button> */} 
             </div>
         </CardHeader>
         <CardContent>
             {isLoading || isFetching ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                   <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading metrics...
                </div>
             ) : error ? (
                 <div className="text-center py-10 text-destructive">
                    Error loading metrics: {(error as Error).message}
                 </div>
             ) : metrics.length === 0 ? (
                 <div className="text-center py-10 text-muted-foreground">
                     No default metrics found or no data for {getMonthName(selectedMonth)} {selectedYear}.
                 </div>
             ) : (
               <motion.div 
                 key={`${selectedMonth}-${selectedYear}`}
                 className="space-y-4" 
                 variants={listVariants} 
                 initial="hidden" 
                 animate="visible"
                 exit="exit"
                >
                   <div className="grid grid-cols-12 gap-4 px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Metric</div>
                      <div className="col-span-3 text-right pr-4">Target</div>
                      <div className="col-span-4 text-right pr-4">Actuals</div>
                   </div>
                    <AnimatePresence>
                      {metrics.map((metric, index) => (
                        <motion.div 
                          key={metric.id} 
                          className="grid grid-cols-12 items-center gap-4 px-3 py-2 hover:bg-muted/50 rounded-md"
                          variants={itemVariants}
                          layout
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                           <div className="col-span-1 text-muted-foreground text-sm">{index + 1}</div>
                           <div className="col-span-4 font-medium">{metric.name} <span className="text-xs text-muted-foreground">({metric.unit})</span></div>
                           <div className="col-span-3">
                             <Input 
                               type="text"
                               inputMode="decimal"
                               value={metric.target}
                               onChange={(e) => handleInputChange(metric.id, 'target', e.target.value)}
                               className="text-right tabular-nums" 
                               placeholder="Enter target"
                               disabled={saveMutation.isPending}
                              />
                           </div>
                           <div className="col-span-4">
                             <Input 
                               type="text"
                               inputMode="decimal"
                               value={metric.actual}
                               onChange={(e) => handleInputChange(metric.id, 'actual', e.target.value)}
                               className="text-right tabular-nums" 
                               placeholder="Enter actual"
                               disabled={saveMutation.isPending}
                              />
                           </div>
                         </motion.div>
                      ))}
                   </AnimatePresence>
               </motion.div>
             )} 
         </CardContent>
         <DialogFooter className="p-4 pt-0 border-t mt-4">
             <Button 
                onClick={() => saveMutation.mutate()} 
                disabled={saveMutation.isPending || isLoading || metrics.length === 0}
              >
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                Save Changes
             </Button>
         </DialogFooter>
       </Card>

      {/* Bulk Upload Dialog (Keep existing logic if needed) */}
       <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
         {/* ... Dialog Content ... */}
       </Dialog>
    </div>
  );
}
