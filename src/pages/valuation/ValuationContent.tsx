import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Save, X, Check, BarChart4, RefreshCw, Info, TrendingUp, Sigma, ListChecks, CircleDollarSign, MinusCircle } from 'lucide-react';
import { useValuation } from '@/hooks/useValuation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LabelList 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

// Define valuation method weight type
interface MethodWeightConfig {
  weight: number;
  enabled: boolean;
}

// Define structure for valuation methods data (real or mock)
interface ValuationMethodsData {
  scorecard?: number;
  checklist?: number; // Changed from checklistMethod for consistency
  ventureCap?: number;
  dcfGrowth?: number;
  dcfMultiple?: number;
  weights?: Record<string, MethodWeightConfig>;
}

// Define CompanyData interface
interface CompanyData {
  id: string;
  name?: string;
  industry?: string;
  founded_year?: number;
  business_activity?: string;
  stage?: string;
  total_employees?: number;
  last_revenue?: number; // Add last_revenue here
}

// Add interface for Valuation data from hook if not already defined globally
interface ValuationHookData {
    id: string;
    company_id?: string; // Assuming this might exist
    selected_valuation?: number;
    pre_money_valuation?: number;
    investment?: number;
    post_money_valuation?: number;
    initial_estimate?: number;
    valuation_min?: number;
    valuation_max?: number;
    last_year_ebitda?: number;
    industry_multiple?: number;
    annual_roi?: number;
    valuation_methods?: ValuationMethodsData;
    // Add other fields as returned by the hook
}

// --- Helper function for chart axis/tooltip formatting --- 
function formatChartValue(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else if (value === 0) {
    return '$0'; // Ensure 0 is formatted correctly
  } else {
    return `$${value}`;
  }
}
// --- End Helper Function ---

export function ValuationContent() {
  const { toast } = useToast();
  const [rangeValue, setRangeValue] = useState<number>(54000);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUnsavedChange, setHasUnsavedChange] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    valuation: data,
    isLoading: valuationLoading,
    error: valuationError,
    isQuestionnaireComplete,
    calculationStatus,
    updateSelectedValuation,
    recalculateValuation,
  } = useValuation();

  // Fetch Company Data - Fetch the FIRST company as context
  const { data: company, isLoading: companyLoading } = useQuery<CompanyData | null>({
    queryKey: ['company-details-valuation'], // Unique key
    queryFn: async () => {
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1) // Get the first company
        .single();
        
      if (error && error.code !== 'PGRST116') { // Ignore if no company exists yet
        console.error("Error fetching company data:", error);
        toast({ title: "Error", description: "Could not load company details.", variant: "destructive" });
        return null;
      }
      return companyData;
    },
  });

  // Handle slider changes
  const handleRangeChange = (value: number[]) => {
    setRangeValue(value[0]);
    setHasUnsavedChange(true);
  };

  // Save the selected value - Use isSaving state
  const saveSelectedValuation = async () => {
    setIsSaving(true); 
    setJustSaved(true);
    setHasUnsavedChange(false);
    try {
      // updateSelectedValuation likely returns a promise or handles its own state.
      // We primarily manage the button's UI state locally.
      await updateSelectedValuation(rangeValue); 
      // Assuming success toast is handled by useValuation hook's onSuccess
    } catch (error) { 
      console.error("Save failed:", error);
      setHasUnsavedChange(true); // Allow retry
      // Assuming error toast is handled by useValuation hook's onError
    } finally {
      setIsSaving(false); 
      setTimeout(() => setJustSaved(false), 1000);
    }
  };
  
  // Update slider from data (if not dragging/unsaved)
  useEffect(() => {
    if (data && data.selected_valuation && !isDragging && !hasUnsavedChange) {
      setRangeValue(data.selected_valuation);
    }
  }, [data, isDragging, justSaved, hasUnsavedChange]);

  // Initial/Forced Recalculation Logic (keep existing useEffects for this)
  useEffect(() => {
    // ... existing logic to trigger recalculateValuation if needed ...
  }, [data, calculationStatus, recalculateValuation]);

  // Global mouse/touch up handlers for slider drag state
  useEffect(() => {
    const handleGlobalMouseUp = () => isDragging && setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Mock data for UI rendering if needed
  const mockValuationData: ValuationMethodsData = {
    scorecard: 2400000,
    checklist: 3000000,
    ventureCap: 1600000,
    dcfGrowth: 1400000,
    dcfMultiple: 1200000,
    weights: {
      scorecard: { weight: 30, enabled: true },
      checklist: { weight: 30, enabled: true },
      ventureCap: { weight: 20, enabled: true },
      dcfGrowth: { weight: 10, enabled: true },
      dcfMultiple: { weight: 10, enabled: true }
    }
  };
  
  // Determine data source
  const valuationMethodsData = data?.valuation_methods || (valuationLoading || companyLoading ? {} : mockValuationData);
  const methodWeights = valuationMethodsData.weights || mockValuationData.weights;

  // Prepare data for the Recharts BarChart
  const chartData = [
    { name: 'Scorecard', value: valuationMethodsData.scorecard ?? 0, fill: '#8b5cf6' }, // Purple
    { name: 'Checklist', value: valuationMethodsData.checklist ?? 0, fill: '#ec4899' }, // Pink
    { name: 'Venture Capital', value: valuationMethodsData.ventureCap ?? 0, fill: '#64748b' }, // Slate
    { name: 'DCF Growth', value: valuationMethodsData.dcfGrowth ?? 0, fill: '#a78bfa' }, // Lighter Purple
    { name: 'DCF Multiples', value: valuationMethodsData.dcfMultiple ?? 0, fill: '#34d399' } // Green
  ];

  // Prepare data for the Info section
  const infoData = {
    lastYearEbitda: data?.last_year_ebitda ?? 150,
    industryMultiple: data?.industry_multiple ?? 8.067476,
    annualRoi: data?.annual_roi ?? -39,
    lastYearRevenue: company?.last_revenue ?? 0
  };
  
  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  // --- Render Logic ---
  const isLoading = valuationLoading || companyLoading;
  const error = valuationError;

  if (isLoading) {
    // Add a nicer loading state skeleton if desired
    return <div className="p-8 text-center text-muted-foreground">Loading valuation analysis...</div>;
  }
  
  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error instanceof Error ? error.message : "Unknown error"}</div>;
  }
  
  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">No valuation data available.</div>;
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section 1: Summary and Funding */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={itemVariants}>
        {/* ValE Summary Card */}
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Valuation Summary
            </CardTitle>
            <CardDescription>Key company details influencing valuation.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium text-muted-foreground">Revenue:</span> {formatCurrency(company?.last_revenue ?? 0)}</div>
            <div><span className="font-medium text-muted-foreground">Employees:</span> {company?.total_employees ?? 'N/A'}</div>
            <div><span className="font-medium text-muted-foreground">Industry:</span> {company?.industry ?? 'N/A'}</div>
            <div><span className="font-medium text-muted-foreground">Stage:</span> {company?.stage ?? 'N/A'}</div>
            <div><span className="font-medium text-muted-foreground">Activity:</span> {company?.business_activity ?? 'N/A'}</div>
            <div><span className="font-medium text-muted-foreground">Questionnaire:</span> {isQuestionnaireComplete ? <Badge variant="default">Complete</Badge> : <Badge variant="secondary">Incomplete</Badge>}</div>
          </CardContent>
        </Card>
        
        {/* Current Funding Round Card */}
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              Funding & Valuation Status
            </CardTitle>
            <CardDescription>Current round details and valuation estimates.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium text-muted-foreground">Pre-Money:</span> {formatCurrency(data.pre_money_valuation ?? 0)}</div>
            <div><span className="font-medium text-muted-foreground">Investment:</span> {formatCurrency(data.investment ?? 0)}</div>
            <div><span className="font-medium text-muted-foreground">Post-Money:</span> {formatCurrency(data.post_money_valuation ?? 0)}</div>
            <div><span className="font-medium text-muted-foreground">Initial Est:</span> {formatCurrency(data.initial_estimate ?? 0)}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 2: Interactive Valuation Slider */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
           <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
              <div>
                <CardTitle>Selected Valuation</CardTitle>
                <CardDescription>Adjust and save your final selected valuation.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                 <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                         <Button 
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={recalculateValuation}
                            disabled={calculationStatus === 'calculating' || !data?.companies?.id}
                          >
                           {calculationStatus === 'calculating' ? 
                              <RefreshCw className="h-4 w-4 animate-spin" /> : 
                              <RefreshCw className="h-4 w-4" />} 
                           <span>Recalculate</span>
                         </Button>
                      </TooltipTrigger>
                      <TooltipContent>Recalculate valuation based on latest inputs.</TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
                <Button 
                  size="sm"
                  className="gap-1.5 w-24"
                  onClick={saveSelectedValuation}
                  disabled={!hasUnsavedChange || isSaving}
                >
                  {isSaving ? (
                     <RefreshCw className="h-4 w-4 animate-spin" /> 
                  ) : ( 
                     <Save className="h-4 w-4" /> 
                  )}
                  <span>{isSaving ? 'Saving...': 'Save'}</span>
                </Button>
              </div>
           </CardHeader>
           <CardContent className="pt-8 pb-6">
              <div className="relative">
                <Slider
                  value={[rangeValue]}
                  onValueChange={handleRangeChange}
                  min={data.valuation_min ?? 0}
                  max={data.valuation_max ?? (rangeValue * 2 || 100000)} // Dynamic max if needed
                  step={1000} // Adjust step as needed
                  onPointerDown={() => setIsDragging(true)}
                  onKeyDown={() => setIsDragging(true)} // Handle keyboard interaction start
                  onKeyUp={() => setIsDragging(false)} // Handle keyboard interaction end
                  className="w-full"
                />
                <div className="text-center mt-4">
                  <span className="text-2xl font-bold text-primary">{formatCurrency(rangeValue)}</span>
                </div>
             </div>
           </CardContent>
        </Card>
      </motion.div>

      {/* Section 3: Valuation Methods Breakdown */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-primary" />
              5 Valuation Methods
            </CardTitle>
            <CardDescription>Combined valuation using weighted averages of different methodologies.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} interval={0} />
                  <YAxis 
                     tickFormatter={formatChartValue}
                     axisLine={false} 
                     tickLine={false} 
                     fontSize={12}
                     width={60}
                  />
                  <RechartsTooltip 
                     cursor={{ fill: 'transparent' }}
                     contentStyle={{ background: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                     formatter={(value) => formatCurrency(value as number)}
                   />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top" formatter={formatChartValue} fontSize={12} fontWeight="medium" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 4: Weights of the Methods */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
              <Sigma className="h-5 w-5 text-primary" />
              Method Weights
            </CardTitle>
            <CardDescription>Weights assigned to each method based on company stage.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {chartData.map((item) => {
              const methodKeyMap: { [key: string]: string } = { // Map display names to keys used in weights object
                'Scorecard': 'scorecard',
                'Checklist': 'checklist',
                'Venture Capital': 'ventureCap',
                'DCF Growth': 'dcfGrowth',
                'DCF Multiples': 'dcfMultiple'
              };
              const key = methodKeyMap[item.name] || item.name.toLowerCase().replace(/ /g, ''); // Fallback just in case
              const weightInfo = methodWeights && methodWeights[key] ? methodWeights[key] : { weight: 0, enabled: false };
              const weight = weightInfo.weight || 0;
              
              return (
                <div key={item.name} className="flex flex-col items-center space-y-2 p-3 rounded-md bg-muted/30 border">
                   <span className="text-sm font-medium text-center h-10 flex items-center justify-center">{item.name}</span> 
                   <TooltipProvider>
                     <Tooltip delayDuration={100}>
                       <TooltipTrigger className="w-full">
                          <Progress value={weight} className="w-full h-2" />
                       </TooltipTrigger>
                       <TooltipContent>{weight}% weight</TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                   <Badge variant="secondary">{weight}%</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Section 5: Additional Info */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Info className="h-5 w-5 text-primary" />
               Key Financial Inputs
            </CardTitle>
            <CardDescription>Factors influencing DCF and Multiple-based valuations.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-md bg-muted/30 border">
               <p className="text-muted-foreground mb-1">Last Year EBITDA (est.)</p>
               <p className="font-semibold text-lg">{formatCurrency(infoData.lastYearEbitda)}</p>
            </div>
             <div className="p-3 rounded-md bg-muted/30 border">
               <p className="text-muted-foreground mb-1">Industry Multiple</p>
               <p className="font-semibold text-lg">{infoData.industryMultiple.toFixed(2)}x</p>
            </div>
             <div className="p-3 rounded-md bg-muted/30 border">
               <p className="text-muted-foreground mb-1">Annual Req. ROI</p>
               <p className={`font-semibold text-lg ${infoData.annualRoi < 0 ? 'text-red-600' : 'text-green-600'}`}>{infoData.annualRoi}%</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </motion.div>
  );
}
