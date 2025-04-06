import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Import Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import Select component for responsive tabs
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Import components previously under Performance page
import { DefaultMetricsTab } from '@/components/performance/DefaultMetricsTab';
import { PerformanceTab } from '@/components/performance/PerformanceTab';
import { CustomMetricsTab } from '@/components/performance/CustomMetricsTab';
import { ValuationContent } from '@/pages/valuation/ValuationContent';

// Import Icons
import { 
  LayoutDashboard, 
  Database, 
  History, 
  PenSquare, 
  Calculator
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  unit: string;
}

interface PerformanceValue {
  id: string;
  actual: number | null;
  target: number | null;
  month: number;
  year: number;
  performance_metrics: PerformanceMetric | null;
}

interface ValuationData {
  id: string;
  selected_valuation: number | null;
  annual_roi: number | null;
  investment: number | null;
  companies: {
    name: string;
    industry: string;
  } | null;
}

interface ChartDataPoint {
  month: string;
  Revenue: number;
  'Gross Margin': number;
}

interface ForecastDataPoint {
  year: string;
  value: number;
}

interface CashBurnDataPoint {
  monthYear: string;
  cash: number | null;
  burn: number | null; // Burn will be calculated
}

// --- Define FinancialMetricCard Component FIRST --- 
interface FinancialMetricCardProps {
  title: string;
  value: string;
  change: number;
  unit: string;
}

function FinancialMetricCard({ title, value, change, unit }: FinancialMetricCardProps) {
  const isPositive = change >= 0;
  // Only show vs Target if change is not exactly 0, otherwise indicate no change or N/A?
  const changeText = change !== 0 ? `${isPositive ? '+' : ''}${change.toFixed(1)}% vs Target` : "(vs Target N/A)"; // Or adjust as needed
  const changeColor = change === 0 ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <motion.div 
      className="p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
      whileHover={{ y: -3 }}
    >
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}<span className="text-sm font-normal ml-1">{unit}</span></p>
      <p className={`text-xs ${changeColor} mt-2`}>{changeText}</p>
    </motion.div>
  );
}
// --- End FinancialMetricCard Definition ---

export default function FinancialOverview() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: performanceData } = useQuery<PerformanceValue[]>({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_values')
        .select('*, performance_metrics(name, unit)')
        .order('year', { ascending: true })
        .order('month', { ascending: true });
        
      if (error) {
        toast({
          title: "Error loading performance data",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      if (!data || data.length === 0) {
        const { data: metrics } = await supabase
          .from('performance_metrics')
          .select('*')
          .eq('is_default', true);
          
        if (metrics && metrics.length > 0) {
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          
          const sampleData = metrics.map(metric => {
            let actual = 0;
            let target = 0;
            
            if (metric.name.toLowerCase() === 'revenue') {
              actual = 120000;
              target = 100000;
            } else if (metric.name.toLowerCase() === 'gross margin') {
              actual = 35;
              target = 30;
            } else if (metric.name.toLowerCase() === 'cash on hand') {
              actual = 250000;
              target = 200000;
            } else if (metric.name.toLowerCase().includes('customer')) {
              actual = 125;
              target = 100;
            }
            
            return {
              metric_id: metric.id,
              month: currentMonth,
              year: currentYear,
              actual: actual,
              target: target
            };
          });
          
          for (const sample of sampleData) {
            await supabase.from('performance_values').upsert(sample, {
              onConflict: 'metric_id, month, year'
            });
          }
          
          const { data: refreshedData } = await supabase
            .from('performance_values')
            .select('*, performance_metrics(name, unit)')
            .order('year', { ascending: true })
            .order('month', { ascending: true });
            
          return refreshedData || [];
        }
      }
      
      return data || [];
    },
  });
  
  const processChartData = (): ChartDataPoint[] => {
    if (!performanceData || performanceData.length === 0) {
      return [
        { month: '10/2024', Revenue: 0, 'Gross Margin': 0 },
        { month: '11/2024', Revenue: 0, 'Gross Margin': 0 },
        { month: '12/2024', Revenue: 0, 'Gross Margin': 0 },
        { month: '1/2025', Revenue: 0, 'Gross Margin': 0 },
        { month: '2/2025', Revenue: 0, 'Gross Margin': 0 }
      ];
    }
    
    const groupedData: Record<string, ChartDataPoint> = {};
    
    performanceData.forEach(item => {
      const monthYear = `${item.month}/${item.year}`;
      
      if (!groupedData[monthYear]) {
        groupedData[monthYear] = { month: monthYear, Revenue: 0, 'Gross Margin': 0 };
      }
      
      const metricName = item.performance_metrics?.name?.toLowerCase();
      if (metricName === 'revenue') {
        groupedData[monthYear].Revenue = item.actual || 0;
      } else if (metricName === 'gross margin') {
        groupedData[monthYear]['Gross Margin'] = item.actual || 0;
      }
    });
    
    return Object.values(groupedData).sort((a, b) => {
      const [aMonth, aYear] = a.month.split('/').map(Number);
      const [bMonth, bYear] = b.month.split('/').map(Number);
      
      if (aYear !== bYear) return aYear - bYear;
      return aMonth - bMonth;
    });
  };
  
  const processCashBurnData = (): CashBurnDataPoint[] => {
    if (!performanceData || performanceData.length === 0) {
      // Return empty or placeholder data if no performance data
      return [];
    }

    // 1. Filter for Cash on Hand data only
    const cashDataPoints = performanceData
      .filter(item => item.performance_metrics?.name?.toLowerCase() === 'cash on hand' && item.actual != null)
      .map(item => ({
        date: new Date(item.year, item.month - 1), // Create Date object for sorting
        monthYear: `${item.month}/${item.year}`,
        cash: item.actual,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // 2. Sort chronologically

    if (cashDataPoints.length < 1) {
        // Return empty if no cash data points found
        return [];
    }

    // 3. Calculate burn rate
    const cashBurnPoints: CashBurnDataPoint[] = [];
    for (let i = 0; i < cashDataPoints.length; i++) {
      const currentPoint = cashDataPoints[i];
      let burnRate: number | null = null;
      
      if (i > 0) {
        const previousPoint = cashDataPoints[i - 1];
        // Ensure both points have cash values before calculating burn
        if (previousPoint.cash != null && currentPoint.cash != null) {
           burnRate = previousPoint.cash - currentPoint.cash;
        } 
      }
      
      cashBurnPoints.push({
        monthYear: currentPoint.monthYear,
        cash: currentPoint.cash,
        burn: burnRate, // Assign calculated burn rate
      });
    }
    
    // Return the last 12 months or all available points
    return cashBurnPoints.slice(-12);
  };
  
  const getCurrentMonthMetrics = (metricName: string): PerformanceValue | undefined => {
    if (!performanceData || performanceData.length === 0) return undefined;
    
    const lowerMetricName = metricName.toLowerCase();
    
    return performanceData.find(item => 
      item.month === selectedMonth && 
      item.year === selectedYear && 
      item.performance_metrics?.name?.toLowerCase() === lowerMetricName
    );
  };
  
  const calculateChange = (actual: number | null, target: number | null): number => {
    if (!actual || !target || target === 0) return 0;
    return ((actual - target) / target) * 100;
  };
  
  const cashBurnData = processCashBurnData();
  const latestCashBurnPoint = cashBurnData[cashBurnData.length - 1];
  
  const revenueMetric = getCurrentMonthMetrics('revenue');
  const grossMarginMetric = getCurrentMonthMetrics('gross margin');
  const cashMetric = getCurrentMonthMetrics('cash on hand');
  const customersMetric = getCurrentMonthMetrics('no. of paying customers');
  const latestBurnRate = latestCashBurnPoint?.burn;
  
  const financialData = processChartData();
  
  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };
  
  const tabContentVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
  };

  // --- Define Tabs --- 
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
      component: (
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-lg font-semibold">Performance Snapshot ({new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })})</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('update-metrics')}>
                  Update Metrics
                </Button>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <FinancialMetricCard
                  title="Revenue"
                  value={formatCurrency(revenueMetric?.actual ?? 0)}
                  change={calculateChange(revenueMetric?.actual, revenueMetric?.target)}
                  unit=""
                />
                <FinancialMetricCard
                  title="Gross Margin"
                  value={formatPercentage(grossMarginMetric?.actual)}
                  change={calculateChange(grossMarginMetric?.actual, grossMarginMetric?.target)}
                  unit="%"
                />
                <FinancialMetricCard
                  title="Cash on Hand"
                  value={formatCurrency(cashMetric?.actual ?? 0)}
                  change={calculateChange(cashMetric?.actual, cashMetric?.target)}
                  unit=""
                />
                <FinancialMetricCard
                  title="Burn Rate"
                  value={formatCurrency(latestBurnRate ?? 0)}
                  change={0}
                  unit=""
                />
                <FinancialMetricCard
                  title="Customers"
                  value={formatNumber(customersMetric?.actual)}
                  change={calculateChange(customersMetric?.actual, customersMetric?.target)}
                  unit=""
                />
              </div>
            </Card>
          </motion.div>
          
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={itemVariants}>
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Financial Performance</h2>
                <p className="text-sm text-muted-foreground">Revenue and Gross Margin over time</p>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip formatter={(value, name) => 
                      name === 'Gross Margin' ? 
                      `${value}%` : 
                      formatCurrency(value as number) // Assert value as number
                    } />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Revenue" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="Gross Margin" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Cash Flow</h2>
                <p className="text-sm text-muted-foreground">Cash on Hand and Calculated Burn Rate trend</p>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashBurnData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthYear" />
                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                        <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} /> // Assert value as number
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="cash" name="Cash on Hand" stroke="#3b82f6" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="burn" name="Burn Rate" stroke="#ef4444" connectNulls /> 
                    </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )
    },
    {
      id: 'valuation-analysis',
      label: 'Valuation Analysis',
      icon: <Calculator className="h-4 w-4" />,
      component: <ValuationContent />
    },
    {
      id: 'update-metrics',
      label: 'Update Metrics',
      icon: <Database className="h-4 w-4" />,
      component: <DefaultMetricsTab />
    },
    {
      id: 'performance-history',
      label: 'Performance History',
      icon: <History className="h-4 w-4" />,
      component: <PerformanceTab />
    },
    {
      id: 'metric-definitions',
      label: 'Metric Definitions',
      icon: <PenSquare className="h-4 w-4" />,
      component: <CustomMetricsTab />
    }
  ];

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold mb-2">Financial Overview</h1>
        <p className="text-muted-foreground">Analyze your startup's financial health and performance</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          {/* Standard Tabs for Medium screens and up */}
          <TabsList className="mb-6 bg-background border-b border-border rounded-none p-0 w-full max-w-fit overflow-x-auto hidden md:flex">
            {tabs.map(tab => (
              <TabsTrigger 
                key={`${tab.id}-desktop`}
                value={tab.id} 
                className={`px-6 py-3 rounded-none flex items-center gap-2 transition-all duration-200 ${activeTab === tab.id ? 'border-b-2 border-primary font-medium text-primary' : 'text-muted-foreground'}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Select Dropdown for Small screens */}
          <div className="mb-6 md:hidden"> 
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a section..." />
              </SelectTrigger>
              <SelectContent>
                {tabs.map(tab => (
                  <SelectItem key={`${tab.id}-mobile`} value={tab.id}>
                    <div className="flex items-center gap-2">
                      {tab.icon} 
                      <span>{tab.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Tabs Content with Animation */}
          <AnimatePresence mode="wait">
             {tabs.map(tab => (
                activeTab === tab.id && (
                  <motion.div
                    key={tab.id} // Use tab.id as key for animation
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tabContentVariants} 
                  >
                    <TabsContent value={tab.id} forceMount className="outline-none mt-6">
                      {tab.component} 
                    </TabsContent>
                  </motion.div>
                )
              ))}
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
