import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { PencilLine, BarChart4, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Define types for fetched data for clarity
interface Company {
  id: string;
  name?: string;
  industry?: string;
  founded_year?: number;
  business_activity?: string;
  stage?: string;
  // Add other company fields as needed
}

interface Valuation {
  id: string;
  selected_valuation?: number;
  // Add other valuation fields as needed
}

interface Investment {
  id: string;
  capital_invested?: number;
  number_of_shares?: number;
  // Add other investment fields as needed
}

interface PerformanceValue {
  id: string;
  actual?: number;
  target?: number;
  month?: number;
  year?: number;
  performance_metrics?: {
    name?: string;
    unit?: string;
  } | null;
}

// Shareholder type (only need count for now)
interface Shareholder {
  id: string;
  // Add other fields if needed later
}

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Query to fetch company data
  const { data: company } = useQuery<Company | null>({
    queryKey: ['company'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();
        
      if (error) {
        toast({
          title: "Error loading company data",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    },
  });
  
  // Query to fetch valuation data
  const { data: valuation } = useQuery<Valuation | null>({
    queryKey: ['valuation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .limit(1)
        .single();
        
      if (error) {
        console.error("Error fetching valuation:", error);
        return null;
      }
      
      return data;
    },
  });
  
  // Query to fetch investment data
  const { data: investments } = useQuery<Investment[] | null>({
    queryKey: ['investments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investments')
        .select('*');
        
      if (error) {
        console.error("Error fetching investments:", error);
        return [];
      }
      
      return data;
    },
  });
  
  // Query to fetch shareholder count
  const { data: shareholderCount, isLoading: shareholderLoading } = useQuery<number>({
    queryKey: ['shareholder-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('shareholders')
        .select('id', { count: 'exact', head: true }); // Use head:true for efficiency

      if (error) {
        console.error("Error fetching shareholder count:", error);
        // Don't show toast for count error, just return 0
        return 0;
      }
      return count ?? 0;
    },
  });
  
  // Query for CURRENT month performance metrics for snapshot
  const { data: performanceMetrics, isLoading: perfLoading } = useQuery<PerformanceValue[] | null>({
    queryKey: ['performance-metrics-latest'], // Fetches for current month/year
    queryFn: async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const { data, error } = await supabase
        .from('performance_values')
        .select('*, performance_metrics(name, unit)')
        .eq('month', currentMonth)
        .eq('year', currentYear);
      if (error) {
        console.error("Error fetching performance metrics:", error);
        return [];
      }
      return data;
    },
  });
  
  // Query for last 2 Cash on Hand data points
  const { data: cashHistory, isLoading: cashHistoryLoading } = useQuery<PerformanceValue[] | null>({
    queryKey: ['cash-history-for-burn'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_values')
        .select('actual, month, year, performance_metrics!inner(name)') // Select necessary fields
        .eq('performance_metrics.name', 'Cash on Hand') // Filter by metric name
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(2); // Get only the last two records

      if (error) {
        console.error("Error fetching cash history:", error);
        // Don't show toast, just return null
        return null;
      }
      // We need data sorted oldest to newest for calculation
      return data ? data.reverse() : null;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
  
  // Calculate total investment
  const totalInvestment = investments?.reduce((sum, investment) => 
    sum + (investment.capital_invested || 0), 0) || 0;
    
  // Calculate share price if we have investments with shares
  const sharePrice = () => {
    if (!investments || investments.length === 0) return 0;
    
    const totalShares = investments.reduce((sum, inv) => sum + (inv.number_of_shares || 0), 0);
    return totalShares > 0 ? totalInvestment / totalShares : 0;
  };
  
  // Function to find a specific metric from the fetched data
  const getMetricValue = (metricName: string): PerformanceValue | undefined => {
    // Add explicit array check for robustness
    if (!Array.isArray(performanceMetrics)) return undefined; 
    const metric = performanceMetrics.find(m => 
      m.performance_metrics?.name?.toLowerCase() === metricName.toLowerCase()
    );
    return metric;
  };

  // Helper for snapshot card changes
  const calculateChange = (actual: number | null, target: number | null): { text: string; color: string } => {
    if (actual == null || target == null || target === 0) {
        return { text: "(vs Target N/A)", color: "text-muted-foreground" };
    }
    const change = ((actual - target) / Math.abs(target)) * 100; // Use Math.abs for correct % change
    // TODO: Add logic here if lower change is better for certain metrics (like Burn Rate if it had a target)
    const changeText = `${change.toFixed(1)}% vs Target`;
    const changeColor = change === 0 ? 'text-muted-foreground' : change > 0 ? 'text-green-500' : 'text-red-500';
    return { text: changeText, color: changeColor };
  };

  // Calculate Burn Rate (needs cashHistory, which has its own loading state)
  let latestCalculatedBurnRate: number | null = null;
  if (cashHistory && cashHistory.length === 2) {
      const lastMonthCash = cashHistory[0].actual;
      const currentMonthCash = cashHistory[1].actual;
      if (lastMonthCash != null && currentMonthCash != null) {
          latestCalculatedBurnRate = lastMonthCash - currentMonthCash;
      }
  }
  
  // Profile completion percentage
  const profileCompletion = 20;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } },
    hover: { scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 10 } }
  };

  const cardHoverProps = { // Reusable hover props for cards
     whileHover: "hover",
     variants: { ...itemVariants } // Combine item entry and hover
  };

  // Determine the period for displayed metrics
  const metricsMonth = performanceMetrics?.[0]?.month;
  const metricsYear = performanceMetrics?.[0]?.year;
  const metricsPeriod = metricsMonth && metricsYear ? `${new Date(0, metricsMonth -1).toLocaleString('default', { month: 'long' })} ${metricsYear}` : "Latest";

  // --- StatCard click handler --- 
  const handleStatCardClick = (link: string | undefined, fragment?: string) => {
    if (!link) return;
    const destination = fragment ? `${link}#${fragment}` : link;
    navigate(destination);
  };

  const isLoading = perfLoading || cashHistoryLoading || shareholderLoading; 

  return (
    <motion.div
      className="space-y-10" // Increased spacing
      initial="hidden"
      animate="visible"
      variants={containerVariants} // Use container for stagger
    >
      {/* Header */}
      <motion.div variants={itemVariants}> {/* Use item variant for individual elements */} 
        <h1 className="text-3xl font-bold mb-1">{company?.name || "Company"} Health Dashboard</h1>
        <p className="text-muted-foreground">A high-level overview of your startup's status.</p>
      </motion.div>

      {/* Section 1: Key Stats (Valuation, Funding, Stage) */}
      <motion.section variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div {...cardHoverProps}> {/* Apply reusable hover props */} 
          <StatCard
            title="Selected Valuation"
            value={formatCurrency(valuation?.selected_valuation || 0)}
            onClick={() => handleStatCardClick('/financial-overview', 'valuation-analysis')}
            linkText="Analyze Valuation"
            icon={<BarChart4 className="w-6 h-6 text-blue-600"/>}
          />
        </motion.div>
        <motion.div {...cardHoverProps}>
           <StatCard
            title="Total Raised"
            value={formatCurrency(totalInvestment)}
            linkTo="/cap-table"
            linkText="View Cap Table"
            icon={<ArrowUp className="w-6 h-6 text-green-600"/>}
          />
        </motion.div>
        <motion.div {...cardHoverProps}>
           <StatCard
            title="Company Stage"
            value={company?.stage || "N/A"}
            linkTo="/settings"
            linkText="Edit Profile"
            icon={<PencilLine className="w-6 h-6 text-purple-600"/>}
          />
        </motion.div>
      </motion.section>

      {/* Section 2: Performance Snapshot */}
      <motion.section variants={containerVariants}>
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Performance Snapshot ({metricsPeriod})</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/financial-overview?tab=update-metrics')}>
                 Update Metrics
              </Button>
          </div>
          {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                 {/* Placeholder loading cards */} 
                 {Array.from({ length: 5 }).map((_, i) => (
                     <div key={i} className="p-4 rounded-lg border bg-card h-28 animate-pulse"></div>
                 ))}
              </div>
          ) : (
              // --- Calculate metrics ONLY when not loading --- 
              (() => { // Use IIFE to scope metric variables
                // Calculate metrics *inside* the check, ensuring performanceMetrics is an array
                const revenueMetric = getMetricValue('revenue');
                const grossMarginMetric = getMetricValue('gross margin');
                const cashMetric = getMetricValue('cash on hand'); // Still needed for its card
                const customersMetric = getMetricValue('no. of paying customers');

                return (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      <PerformanceSnapshotCard 
                          title="Revenue" 
                          value={formatCurrency(revenueMetric?.actual ?? 0)} 
                          {...calculateChange(revenueMetric?.actual, revenueMetric?.target)}
                      />
                      <PerformanceSnapshotCard 
                          title="Gross Margin" 
                          value={formatPercentage(grossMarginMetric?.actual ?? 0)} 
                          {...calculateChange(grossMarginMetric?.actual, grossMarginMetric?.target)}
                      />
                       <PerformanceSnapshotCard 
                          title="Cash on Hand" 
                          value={formatCurrency(cashMetric?.actual ?? 0)} 
                          {...calculateChange(cashMetric?.actual, cashMetric?.target)}
                      />
                       <PerformanceSnapshotCard 
                          title="Burn Rate" 
                          value={formatCurrency(latestCalculatedBurnRate ?? 0)} 
                          changeText="(Monthly)" 
                          changeColor="text-muted-foreground"
                      />
                       <PerformanceSnapshotCard 
                          title="Customers" 
                          value={formatNumber(customersMetric?.actual ?? 0)} 
                          {...calculateChange(customersMetric?.actual, customersMetric?.target)}
                      />
                  </div>
                );
              })()
              // --- End metric calculation and rendering --- 
          )}
      </motion.section>

      {/* Section 3: Cap Table Summary */}
      <motion.section variants={itemVariants}> {/* Animate section as a whole */} 
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Cap Table Summary</h2>
             <Link to="/cap-table">
               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                 <Button variant="outline" size="sm">Manage Cap Table</Button>
               </motion.div>
            </Link>
          </div>
           <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <motion.div {...cardHoverProps}> 
               <MiniStatCard title="Total Raised" value={formatCurrency(totalInvestment)} />
             </motion.div>
             <motion.div {...cardHoverProps}>
               <MiniStatCard title="Shareholders" value={shareholderLoading ? "..." : formatNumber(shareholderCount || 0)} />
             </motion.div>
             {/* Add ESOP Pool % if data exists */} 
             {/* <motion.div {...cardHoverProps}><MiniStatCard title="ESOP Pool" value={"15%"} /></motion.div> */} 
             {/* Add Last Round Valuation if different from selected */} 
             {/* <motion.div {...cardHoverProps}><MiniStatCard title="Last Round Valuation" value={formatCurrency(valuation?.pre_money_valuation || 0)} /></motion.div> */} 
           </motion.div>
      </motion.section>

       {/* Remove Old Sections - Example: Profile completion card */}
       {/* 
        <motion.div variants={itemVariants}>
           <Card> ... Profile Completion ... </Card>
        </motion.div> 
       */}

    </motion.div>
  );
}

// --- Reusable Stat Card Components ---

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  linkTo?: string;
  linkText?: string;
  onClick?: () => void;
}

function StatCard({ title, value, icon, linkTo, linkText, onClick }: StatCardProps) {
  const cardContent = (
    <>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="p-2 rounded-md bg-muted">{icon}</span>
      </div>
      <p className="text-3xl font-bold mb-4">{value}</p>
    </>
  );

  const linkElement = (
    <div className="mt-auto pt-2 border-t border-border text-sm text-primary hover:underline cursor-pointer">
      {linkText}
    </div>
  );

  // Use onClick handler if provided, otherwise use Link for direct navigation
  return (
    <Card className="p-4 flex flex-col h-full shadow-sm hover:shadow-lg transition-shadow duration-300">
      {cardContent}
      {onClick ? (
        <div onClick={onClick} className="mt-auto">
          {linkElement}
        </div>
      ) : linkTo && linkText ? (
        <Link to={linkTo} className="mt-auto">
          {linkElement}
        </Link>
      ) : null}
    </Card>
  );
}

interface MiniStatCardProps {
  title: string;
  value: string | number;
}

function MiniStatCard({ title, value }: MiniStatCardProps) {
  return (
    <Card className="p-3 text-center shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col justify-between">
       <div> {/* Top part for title and value */} 
         <p className="text-sm text-muted-foreground mb-1 truncate">{title}</p>
         <p className="text-xl font-semibold">{value}</p>
       </div>
    </Card>
   );
}

// PerformanceSnapshotCard Component
interface PerformanceSnapshotCardProps {
  title: string;
  value: string;
  changeText: string; // Text like "-16.7% vs Target"
  changeColor: string; // Tailwind color class
}

function PerformanceSnapshotCard({ title, value, changeText, changeColor }: PerformanceSnapshotCardProps) {
  return (
    <motion.div 
      className="p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
      whileHover={{ y: -3 }}
    >
      <div> {/* Wrap top content */} 
        <p className="text-sm font-medium text-muted-foreground mb-1 truncate">{title}</p>
        {/* Apply more responsive font size and allow word break */}
        <p className="text-lg sm:text-xl md:text-2xl font-bold break-words">{value}</p> 
      </div>
      <div> {/* Wrap bottom content */} 
        <p className={`text-xs ${changeColor} mt-2 truncate`}>{changeText}</p> 
      </div>
    </motion.div>
  );
}

// Remove old FinancialCard component if no longer needed
// interface FinancialCardProps { ... }
// function FinancialCard({ ... }) { ... }

