import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/Card';
import { Check, X, Eye } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area // Import AreaChart components
} from 'recharts';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GaugeChart } from './GaugeChart'; // Import the new GaugeChart
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters'; // Import formatters

// Type for raw fetched performance data
interface PerformanceValueRaw {
  id: string;
  actual: number | null;
  target: number | null;
  month: number;
  year: number;
  created_at: string; // Keep original timestamp
  performance_metrics: {
    name: string;
    unit: string;
  } | null;
}

// Type for processed data suitable for multi-line chart
interface ProcessedChartData {
  monthYear: string; // e.g., "1/2025"
  timestamp: number; // For sorting
  [key: string]: number | string | null; // Metric values (e.g., Revenue: 5000)
}

// Helper function to format month/year
const formatMonthYear = (month: number, year: number): string => {
  // Use Date object for better formatting
  return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
};

export function PerformanceTab() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Revenue', 'Gross Margin']); // Default selection
  
  // --- Fetch Real Data --- 
  const { data: performanceHistoryData, isLoading, error } = useQuery<PerformanceValueRaw[]>({
    queryKey: ['performance-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_values')
        .select('*, performance_metrics(name, unit)')
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (error) {
        console.error("Error fetching performance history:", error);
        // Consider showing a toast message here
        throw new Error(error.message);
      }
      return data || [];
    },
     staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // --- Process Data for Charts --- 
  const processDataForChart = (rawData: PerformanceValueRaw[] | undefined): ProcessedChartData[] => {
    if (!rawData) return [];
    const processed: Record<string, ProcessedChartData> = {};

    rawData.forEach(item => {
      if (!item.performance_metrics) return;
      const monthYear = formatMonthYear(item.month, item.year);
      const timestamp = new Date(item.year, item.month - 1).getTime();
      const metricName = item.performance_metrics.name;

      if (!processed[monthYear]) {
        processed[monthYear] = { monthYear, timestamp };
      }

      // Store both actual and target if available, for gauges and tooltips
      processed[monthYear][metricName] = item.actual;
      processed[monthYear][`${metricName}_target`] = item.target; // Store target separately
      processed[monthYear][`${metricName}_unit`] = item.performance_metrics.unit; // Store unit
    });
    
    return Object.values(processed).sort((a, b) => a.timestamp - b.timestamp);
  };

  const chartData = processDataForChart(performanceHistoryData);

  // Extract available metric names for selection buttons
  const availableMetrics = Array.from(
    new Set(performanceHistoryData?.map(item => item.performance_metrics?.name).filter(Boolean) as string[])
  );

  // --- Get Latest Data for Gauges --- 
  const getLatestMetricData = (metricName: string): { actual: number | null, target: number | null, unit: string | null } => {
    const latestEntry = performanceHistoryData
      ?.filter(item => item.performance_metrics?.name === metricName)
      .sort((a, b) => new Date(b.year, b.month - 1).getTime() - new Date(a.year, a.month - 1).getTime())[0]; // Get the most recent entry
    
    return {
      actual: latestEntry?.actual ?? null,
      target: latestEntry?.target ?? null,
      unit: latestEntry?.performance_metrics?.unit ?? null,
    };
  };

  const latestRevenue = getLatestMetricData('Revenue');
  const latestGrossMargin = getLatestMetricData('Gross Margin');
  // Try to get Burn Rate data, will be null if not tracked
  const latestBurnRate = getLatestMetricData('Burn Rate'); 

  // --- Toggle Metric Selection --- 
  const toggleMetricSelection = (metricName: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricName)
        ? prev.filter(m => m !== metricName)
        : [...prev, metricName]
    );
  };

  // --- Animation Variants ---
  const chartContainerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // Colors for lines (expand this palette)
  const lineColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F", "#FFBB28", "#FF8042"];

  // --- Render Logic ---
  if (isLoading) {
    return <div className="text-center p-10">Loading performance history...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-600">Error loading data: {error.message}</div>;
  }

  return (
    <motion.div 
      className="space-y-8" // Increased spacing
      initial="hidden"
      animate="visible"
      variants={chartContainerVariants}
    >
      {/* Section 1: Multi-Metric Trend Line Chart */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Performance Trend</h2>
        {/* Metric Selection Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {availableMetrics.map(metric => (
            <Button
              key={metric}
              variant={selectedMetrics.includes(metric) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleMetricSelection(metric)}
              className="transition-all duration-200"
            >
              {metric}
            </Button>
          ))}
        </div>
        {/* Enhanced Line Chart */}
        {chartData.length > 0 ? (
          <Card className="p-4 pt-6 shadow-sm"> {/* Added padding top */} 
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3}/>
                <XAxis dataKey="monthYear" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', border: 'none', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                  itemStyle={{ fontSize: 12 }}
                  // Enhanced formatter to show unit and target if available
                  formatter={(value: number, name: string, entry) => {
                    const unit = entry.payload[`${name}_unit`];
                    const target = entry.payload[`${name}_target`];
                    let displayVal = value?.toLocaleString() ?? 'N/A';
                    if (unit === '%') displayVal = formatPercentage(value);
                    if (unit === '$') displayVal = formatCurrency(value);
                    
                    let targetText = '';
                    if (target != null) {
                      let displayTarget = target.toLocaleString();
                      if (unit === '%') displayTarget = formatPercentage(target);
                      if (unit === '$') displayTarget = formatCurrency(target);
                      targetText = ` (Target: ${displayTarget})`;
                    }
                    return [`${displayVal}${targetText}`, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }}/>
                {selectedMetrics.map((metricName, index) => (
                  <Line 
                    key={metricName}
                    type="monotone" // Or "natural" for smoother curves
                    dataKey={metricName}
                    stroke={lineColors[index % lineColors.length]} // Cycle through colors
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    connectNulls // Connect line across missing data points
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <p className="text-center py-16 text-muted-foreground">No performance data available for the selected period or metrics.</p>
        )}
      </div>

      {/* Section 2: KPI Gauges for Latest Period */}
      <div>
         <h2 className="text-xl font-semibold mb-4">Latest Performance Snapshot</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
           {/* Render gauges only if data exists */}
           {latestRevenue.actual != null && (
              <GaugeChart 
                label="Revenue vs Target"
                value={latestRevenue.actual}
                target={latestRevenue.target}
                unit="$"
              />
            )}
             {latestGrossMargin.actual != null && (
               <GaugeChart 
                 label="Gross Margin vs Target"
                 value={latestGrossMargin.actual}
                 target={latestGrossMargin.target}
                 unit="%"
               />
             )}
              {/* Add Burn Rate gauge only if data exists */} 
             {latestBurnRate.actual != null && (
                 <GaugeChart 
                     label="Burn Rate"
                     value={latestBurnRate.actual}
                     target={latestBurnRate.target} // Target might be less relevant for burn, maybe set max differently
                     unit="$"
                  />
             )} 
             {/* Add fallback if no gauges can be shown? */} 
         </div>
       </div>

      {/* Section 3: Burn Rate vs Revenue Area Chart */}
       <div>
          <h2 className="text-xl font-semibold mb-4">Burn Rate vs. Revenue</h2>
          {chartData.some(d => d['Burn Rate'] != null || d['Revenue'] != null) ? (
             <Card className="p-4 pt-6 shadow-sm"> {/* Added padding top */} 
               <ResponsiveContainer width="100%" height={300}>
                 <AreaChart 
                   data={chartData} 
                   margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                 >
                   <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3}/>
                   <XAxis dataKey="monthYear" tick={{ fontSize: 11 }}/>
                   <YAxis tick={{ fontSize: 11 }}/>
                   <Tooltip formatter={(value) => formatCurrency(value as number)} />
                   <Legend wrapperStyle={{ fontSize: '12px' }}/>
                   <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ff7300" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                   <Area 
                     type="monotone" 
                     dataKey="Revenue" 
                     stroke="#8884d8" 
                     fillOpacity={1} 
                     fill="url(#colorRevenue)" 
                     connectNulls
                   />
                   <Area 
                     type="monotone" 
                     dataKey="Burn Rate" 
                     stroke="#ff7300" 
                     fillOpacity={1} 
                     fill="url(#colorBurn)" 
                     connectNulls
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </Card>
          ) : (
             <Card className="p-4 min-h-[300px] flex items-center justify-center text-muted-foreground">
               Burn Rate vs Revenue data not available.
             </Card>
          )}
       </div>

    </motion.div>
  );
}
