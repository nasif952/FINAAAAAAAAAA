import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { useStartupScore, CompanyData, ValuationData, PerformanceData } from '@/hooks/useStartupScore';
import { useToast } from '@/hooks/use-toast';
import { ScoreData } from '@/lib/calculateScore';
import { Button } from '@/components/Button';
import { RefreshCw, Info, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BenchmarkComparisonCard } from '@/components/valuation/BenchmarkComparisonCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { EditableBenchmarks } from '@/components/valuation/EditableBenchmarks';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

export function BenchmarksContent() {
  const { toast } = useToast();
  const { 
    score: latestScore, 
    calculateScore, 
    loading, 
    refetchScore, 
    companyData, 
    valuationData, 
    performanceData
  } = useStartupScore();
  const [scoreDetails, setScoreDetails] = useState<ScoreData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialCalculationDone, setInitialCalculationDone] = useState(false);
  const [displayData, setDisplayData] = useState<any>(null);

  // Determine if all necessary data for calculation is loaded
  const isDataReadyForCalculation = !!companyData && !!valuationData && !!performanceData;

  console.log("BenchmarksContent rendering with:", { 
    latestScore, 
    scoreDetails, 
    loading, 
    refreshing,
    initialCalculationDone,
    isDataReadyForCalculation
  });

  // Get mock data to show while real data is loading
  const getMockData = () => {
    return {
      total_score: 50,
      finance_score: 45,
      team_score: 75,
      growth_score: 35,
      market_score: 60,
      product_score: 65,
      details: {
        revenue: { score: 34.3, benchmark: 350000, value: 120000, weight: 0.1 },
        gross_margin: { score: 53.8, benchmark: 65, value: 35, weight: 0.1 },
        team_size: { score: 100, benchmark: 15, value: 20, weight: 0.15 },
        valuation: { score: 3.6, benchmark: 1500000, value: 53558.98, weight: 0.05 },
        growth_rate: { score: 12.8, benchmark: 25, value: 3.2, weight: 0.15 },
        cash_on_hand: { score: 70, benchmark: 150000, value: 250000, weight: 0.05 },
        annual_roi: { score: 65, benchmark: 20, value: 33, weight: 0.1 },
        market_size: { score: 80, benchmark: 5000000, value: 4000000, weight: 0.15 },
        product_readiness: { score: 75, benchmark: 100, value: 75, weight: 0.15 }
      }
    };
  };
  
  // Add informational notice about data priority
  const DataPriorityNotice = () => (
    <div className="bg-gray-50 border-l-4 border-primary p-4 mb-6 rounded-md">
      <div className="flex">
        <Info className="h-6 w-6 text-primary mr-3 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium mb-1">The scoring system prioritizes data in the following order:</p>
          <ol className="ml-5 text-sm list-decimal">
            <li>Questionnaire inputs - Values from your valuation questionnaire are used as the primary source of truth.</li>
            <li>Default values - System defaults are used if no other data is available.</li>
          </ol>
          <p className="text-sm mt-2">For the most accurate scoring, ensure your questionnaire contains up-to-date financial information.</p>
        </div>
      </div>
    </div>
  );
  
  // Handler for refreshing the score
  const handleRefreshScore = async () => {
    setRefreshing(true);
    try {
      console.log("Refreshing score - getting latest data from Supabase");
      
      // Force refetch all data from Supabase
      await refetchScore();
      
      const newScore = await calculateScore();
      if (newScore) {
        setScoreDetails(newScore);
        
        // Force the data to refresh again after calculation
        await refetchScore();
        
        toast({
          title: "Score refreshed",
          description: "Your startup score has been updated with the latest data from Supabase."
        });
      }
    } catch (error) {
      console.error("Error refreshing score:", error);
      toast({
        title: "Error refreshing score",
        description: "Could not refresh score. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  // Force recalculation from questionnaire
  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      console.log("Force refreshing from questionnaire - getting latest data directly");
      
      // Get current questionnaire data directly from Supabase
      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('questionnaire_questions')
        .select('question_number, response')
        .order('question_number', { ascending: true });

      if (questionnaireError) {
        throw new Error("Failed to fetch questionnaire data: " + questionnaireError.message);
      }

      // Log important questions for debugging
      const expectedValuationQ = questionnaireData?.find(q => q.question_number === "7.8");
      const profitMarginQ = questionnaireData?.find(q => q.question_number === "6.6");
      const burnRateQ = questionnaireData?.find(q => q.question_number === "6.4");
      const runwayQ = questionnaireData?.find(q => q.question_number === "6.5");
      const growthRateQ = questionnaireData?.find(q => q.question_number === "6.3");
      
      console.log("Expected Valuation (Q7.8):", expectedValuationQ?.response);
      console.log("Profit Margin (Q6.6):", profitMarginQ?.response);
      console.log("Burn Rate (Q6.4):", burnRateQ?.response);
      console.log("Runway (Q6.5):", runwayQ?.response);
      console.log("Revenue Growth Rate (Q6.3):", growthRateQ?.response);
      console.log("Raw Q6.3 Growth Rate Data:", growthRateQ);
      
      // Force a recalculation
      const newScore = await calculateScore();
      
      if (newScore) {
        setScoreDetails(newScore);
        // Ensure we have the latest data from the database
        await refetchScore();
        
        toast({
          title: "Score recalculated",
          description: "Your startup score has been completely recalculated from fresh questionnaire data."
        });
      }
    } catch (error) {
      console.error("Error forcing score refresh:", error);
      toast({
        title: "Error recalculating score",
        description: "Could not recalculate score from questionnaire data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  // Update displayData whenever scoreDetails or latestScore changes
  useEffect(() => {
    console.log("----------------------------------------");
    console.log("DISPLAY DATA UPDATE DEBUG INFO");
    console.log("----------------------------------------");
    // If we have new score details from a manual calculation, prioritize those
    if (scoreDetails) {
      console.log("Score details available:", scoreDetails);
      console.log("Product score from scoreDetails:", scoreDetails.productScore);
      console.log("Product readiness details:", scoreDetails.details['product_readiness']);
      
      const formattedData = {
        total_score: scoreDetails.totalScore,
        finance_score: scoreDetails.financeScore,
        team_score: scoreDetails.teamScore,
        growth_score: scoreDetails.growthScore,
        market_score: scoreDetails.marketScore,
        product_score: scoreDetails.productScore,
        details: scoreDetails.details,
        calculation_date: new Date().toISOString()
      };
      setDisplayData(formattedData);
      console.log("Using scoreDetails for display:", formattedData);
      console.log("Product readiness in formattedData:", formattedData.details['product_readiness']);
    } 
    // Otherwise use latestScore from the database if available
    else if (latestScore) {
      console.log("Latest score available:", latestScore);
      try {
        // Try to load details from localStorage
        let loadedDetails = null;
        if (companyData?.id) {
          try {
            const storageKey = `score_details_${companyData.id}`;
            const storedDetails = localStorage.getItem(storageKey);
            if (storedDetails) {
              loadedDetails = JSON.parse(storedDetails);
              console.log("Loaded score details from localStorage:", loadedDetails);
            }
          } catch (storageError) {
            console.error("Error loading score details from localStorage:", storageError);
          }
        }
        
        // If localStorage doesn't have details, use mock details
        const details = loadedDetails || {
          revenue: { score: 34.3, benchmark: 350000, value: 120000, weight: 0.1 },
          gross_margin: { score: 53.8, benchmark: 65, value: 35, weight: 0.1 },
          team_size: { score: 100, benchmark: 15, value: 20, weight: 0.15 },
          valuation: { score: 3.6, benchmark: 1500000, value: 53558.98, weight: 0.05 },
          growth_rate: { score: 12.8, benchmark: 25, value: 3.2, weight: 0.15 },
          cash_on_hand: { score: 70, benchmark: 150000, value: 250000, weight: 0.05 },
          annual_roi: { score: 65, benchmark: 20, value: 33, weight: 0.1 },
          market_size: { score: 80, benchmark: 5000000, value: 4000000, weight: 0.15 },
          product_readiness: { score: 75, benchmark: 100, value: 75, weight: 0.15 }
        };
        
        const formattedData = {
          ...latestScore,
          details
        };
        setDisplayData(formattedData);
        console.log("Using latestScore for display with details:", formattedData);
      } catch (error) {
        console.error("Error processing score details:", error);
        setDisplayData(latestScore);
        console.log("Using latestScore as-is due to processing error");
      }
    } 
    // If neither is available and we're not loading, use mock data
    else if (!loading) {
      const mockData = getMockData();
      setDisplayData(mockData);
      console.log("Using mock data for display:", mockData);
      console.log("Mock product readiness:", mockData.details.product_readiness);
    }
    console.log("----------------------------------------");
  }, [scoreDetails, latestScore, loading, companyData]);
  
  // Calculate score automatically on component mount, but only once
  useEffect(() => {
    const autoCalculateScore = async () => {
      // IMPROVED CHECK: Only calculate if data is ready, not loading/refreshing, and not done yet
      if (isDataReadyForCalculation && (!latestScore || latestScore.total_score === 0) && !initialCalculationDone && !refreshing && !loading) {
        console.log("Running auto-calculation once - setting initialCalculationDone flag");
        setRefreshing(true); // Use refreshing state to indicate calculation in progress
        setInitialCalculationDone(true); // Mark as attempted
        try {
          const newScore = await calculateScore();
          if (newScore) {
            setScoreDetails(newScore);
            // Optional: refetch data after calculation if needed
            // await refetchScore(); 
            toast({ title: "Score calculated", description: "Initial startup score has been calculated." });
          }
        } catch (error) {
          console.error("Error during auto score calculation:", error);
          toast({
            title: "Auto-calculation Error",
            description: error instanceof Error ? error.message : "Could not automatically calculate score.",
            variant: "destructive"
          });
          setInitialCalculationDone(false); // Allow retry if it failed? Or handle differently.
        } finally {
          setRefreshing(false);
        }
      } else {
         console.log("Skipping auto-calculation:", { isDataReadyForCalculation, hasLatestScore: !!latestScore, initialCalculationDone, refreshing, loading });
      }
    };

    autoCalculateScore();
  // Add all data dependencies to the effect dependencies array
  }, [isDataReadyForCalculation, latestScore, initialCalculationDone, refreshing, loading, calculateScore, toast]); 
  
  // Handler for benchmark changes
  const handleBenchmarksChange = async () => {
    // Recalculate score with new benchmarks
    toast({
      title: "Benchmarks Updated",
      description: "Recalculating your score with the new benchmarks...",
    });
    
    // Trigger score recalculation
    await handleRefreshScore();
  };
  
  // Fallback to mock data if displayData is not set
  const dataToRender = displayData || getMockData();
  
  // Add debug logging to verify the data being displayed
  console.log("Data being rendered in the metrics table:", {
    details: dataToRender.details,
    latestScore: latestScore,
    scoreDetails: scoreDetails
  });
  
  // Function to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };
  
  const getScoreTier = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Very Good";
    if (score >= 60) return "Good";
    if (score >= 50) return "Average";
    if (score >= 40) return "Below Average";
    if (score >= 30) return "Poor";
    return "Critical";
  };
  
  // For debugging - add test product questionnaire values
  const initializeTestQuestionnaire = async () => {
    try {
      toast({
        title: "Initializing test product data",
        description: "Setting up example questionnaire answers..."
      });
      
      // Get existing questionnaire ID
      const { data: questionnaires } = await supabase
        .from('questionnaires')
        .select('id')
        .eq('step_number', 2) // Product questionnaire is step 2
        .single();
        
      if (!questionnaires?.id) {
        toast({
          title: "Error",
          description: "Could not find product questionnaire",
          variant: "destructive"
        });
        return;
      }
      
      // Get existing questions to update them
      const { data: existingQuestions } = await supabase
        .from('questionnaire_questions')
        .select('id, question_number')
        .eq('questionnaire_id', questionnaires.id);
        
      if (!existingQuestions || existingQuestions.length === 0) {
        toast({
          title: "Error", 
          description: "No questions found to update",
          variant: "destructive"
        });
        return;
      }
      
      // Set up test values for specific questions
      const updates = [
        { 
          question_number: "2.1", 
          response: "Working Product with Limited Features"  // 60 score 
        },
        { 
          question_number: "2.7", 
          response: "Strong Evidence of Product-Market Fit"  // 75 score 
        },
        { 
          question_number: "2.9", 
          response: "Highly Scalable"  // 75 score
        }
      ];
      
      // Update each question
      for (const update of updates) {
        const questionToUpdate = existingQuestions.find(q => q.question_number === update.question_number);
        if (questionToUpdate) {
          await supabase
            .from('questionnaire_questions')
            .update({ response: update.response })
            .eq('id', questionToUpdate.id);
        }
      }
      
      toast({
        title: "Test data initialized",
        description: "Product questionnaire updated with test values. Click 'Refresh Score' to see changes."
      });
    } catch (error) {
      console.error("Error initializing test data:", error);
      toast({
        title: "Error",
        description: "Failed to initialize test data",
        variant: "destructive"
      });
    }
  };
  
  // Determine overall loading state for the UI
  const isLoadingUI = loading || refreshing; // Combine hook loading and local refreshing state

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-2">Startup Scoring & Benchmarks</h1>
        <p className="text-muted-foreground">Track your startup's performance against industry benchmarks</p>
      </div>
      
      <DataPriorityNotice />
      
      <div className="flex justify-end mb-4">
        <Link to="/valuation-details?tab=valE">
          <Button variant="outline" iconRight={<ExternalLink size={16} />}>
            View ValE Details
          </Button>
        </Link>
      </div>
      
      <EditableBenchmarks onBenchmarksChange={handleBenchmarksChange} />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Startup Score & Benchmarks</h2>
        <div className="flex gap-2">
           {/* Refresh from DB Button */}
           <TooltipProvider>
             <Tooltip delayDuration={100}>
               <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshScore} 
                    // Disable if loading/refreshing OR if data needed for refetch isn't ready
                    disabled={isLoadingUI || !companyData} 
                    className="gap-1.5"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingUI ? 'animate-spin' : ''}`} />
                    Refresh Score
                  </Button>
               </TooltipTrigger>
               <TooltipContent>Refresh score using latest data from database.</TooltipContent>
             </Tooltip>
           </TooltipProvider>
           
           {/* Force Recalculate Button */}
            <TooltipProvider>
             <Tooltip delayDuration={100}>
               <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleForceRefresh} 
                    // Disable if loading/refreshing OR if data needed for calculation isn't ready
                    disabled={isLoadingUI || !isDataReadyForCalculation} 
                    className="gap-1.5"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingUI ? 'animate-spin' : ''}`} />
                    Recalculate All
                  </Button>
               </TooltipTrigger>
               <TooltipContent>Recalculate score using latest questionnaire data.</TooltipContent>
             </Tooltip>
           </TooltipProvider>
           
          {/* Button to initialize test questionnaire (optional) */}
          {/* <Button variant="secondary" size="sm" onClick={initializeTestQuestionnaire}>Init Test Questionnaire</Button> */}
        </div>
      </div>
      
      {/* Loading Indicator */}
      {isLoadingUI && (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          <span>Loading score data...</span>
        </div>
      )}
      
      {!isLoadingUI && displayData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">Performance Score</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-5xl font-bold ${getScoreColor(dataToRender.total_score)}`}>
                      {dataToRender.total_score}
                    </p>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <p className="text-lg font-medium mt-1">{getScoreTier(dataToRender.total_score)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last updated: {dataToRender.calculation_date 
                      ? new Date(dataToRender.calculation_date).toLocaleDateString() 
                      : 'Never'}
                  </p>
                </div>
                
                <div className="flex items-center mt-4 md:mt-0">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{companyData?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="font-medium">{companyData?.industry || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Founded</p>
                      <p className="font-medium">{companyData?.founded_year || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employees</p>
                      <p className="font-medium">{companyData?.total_employees || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Finance Score</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><Info size={14} className="text-muted-foreground" /></span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Based on revenue, gross margin, cash on hand, and valuation.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-medium">{dataToRender.finance_score}/100</span>
                  </div>
                  <Progress value={dataToRender.finance_score} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Team Score</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><Info size={14} className="text-muted-foreground" /></span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Based on team size and composition.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-medium">{dataToRender.team_score}/100</span>
                  </div>
                  <Progress value={dataToRender.team_score} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Growth Score</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><Info size={14} className="text-muted-foreground" /></span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Based on growth rate and annual ROI.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-medium">{dataToRender.growth_score}/100</span>
                  </div>
                  <Progress value={dataToRender.growth_score} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Market Score</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><Info size={14} className="text-muted-foreground" /></span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Based on market size and competition.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-medium">{dataToRender.market_score}/100</span>
                  </div>
                  <Progress value={dataToRender.market_score} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Product Score</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><Info size={14} className="text-muted-foreground" /></span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Based on product readiness and innovation.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-medium">{dataToRender.product_score}/100</span>
                  </div>
                  <Progress value={dataToRender.product_score} className="h-2" />
                </div>
              </div>
            </div>
          </Card>
          
          <BenchmarkComparisonCard />
        </div>
      )}
      
      <Card>
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold">Detailed Metrics Analysis</h2>
        </div>
        <div className="p-4">
          {dataToRender.details ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Your Value</TableHead>
                  <TableHead>Benchmark</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries((dataToRender.details || {})).map(([key, detail]) => {
                  console.log(`Rendering metric ${key}:`, detail);
                  if (key === 'product_readiness') {
                    console.log("PRODUCT READINESS IN TABLE:", {
                      key,
                      detail
                    });
                  }
                  
                  // Type guard function to check if detail has the expected properties
                  const hasMetricProperties = (obj: any): obj is { 
                    value: number, 
                    benchmark: number, 
                    score: number,
                    weight: number
                  } => {
                    return obj && 
                           typeof obj === 'object' && 
                           'value' in obj && 
                           'benchmark' in obj && 
                           'score' in obj &&
                           'weight' in obj;
                  };
                  
                  // Safe access to properties using the type guard
                  const value = hasMetricProperties(detail) ? detail.value : 0;
                  const benchmark = hasMetricProperties(detail) ? detail.benchmark : 0;
                  const score = hasMetricProperties(detail) ? detail.score : 0;
                  const weight = hasMetricProperties(detail) ? detail.weight : 0;
                  
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </TableCell>
                      <TableCell>
                        {key.includes('revenue') || key.includes('valuation') || key.includes('cash') ? 
                          formatCurrency(Number(value)) : 
                          key.includes('margin') || key.includes('growth') || key.includes('roi') ? 
                            `${value}%` : 
                            String(value)}
                      </TableCell>
                      <TableCell>
                        {key.includes('revenue') || key.includes('valuation') || key.includes('cash') ? 
                          formatCurrency(Number(benchmark)) : 
                          key.includes('margin') || key.includes('growth') || key.includes('roi') ? 
                            `${benchmark}%` : 
                            String(benchmark)}
                      </TableCell>
                      <TableCell>
                        {score.toFixed(1)}/100
                      </TableCell>
                      <TableCell>
                        {`${weight * 100}%`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              {refreshing || loading ? (
                <p>Calculating metrics...</p>
              ) : (
                <p>Click "Recalculate Score" to see detailed metrics.</p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
