import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/client-extension';
import { calculateStartupScore, ScoreData, saveStartupScore } from '@/lib/calculateScore';
import { StartupScore } from '@/integrations/supabase/client-extension';

// Extended PerformanceData interface that includes growth_rate
interface PerformanceData {
  revenue?: number | null;
  gross_margin?: number | null;
  cash_on_hand?: number | null;
  customers?: number | null;
  market_size?: number | null;
  product_readiness?: number | null;
  growth_rate?: number | null;
}

export function useStartupScore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [autoCalculationAttempted, setAutoCalculationAttempted] = useState(false);
  const autoCalculationAttemptedRef = useRef(false);
  
  // Fetch company data
  const { data: companyData } = useQuery({
    queryKey: ['company-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();
        
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds (down from Infinity)
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });
  
  // Fetch valuation data
  const { data: valuationData } = useQuery({
    queryKey: ['valuation-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valuations')
        .select('*, companies(*)')
        .limit(1)
        .single();
        
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds (down from Infinity)
    gcTime: 1000 * 60 * 60, // Cache for 1 hour 
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });
  
  // Fetch performance metrics data (latest month)
  const { data: performanceData } = useQuery({
    queryKey: ['performance-metrics-latest'],
    queryFn: async () => {
      const { data: metrics, error } = await supabase
        .from('performance_values')
        .select('*, performance_metrics(*)')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      // Convert performance values to the required format with proper type conversion
      const result = {
        revenue: null,
        gross_margin: null,
        cash_on_hand: null,
        customers: null,
      };
      
      if (metrics) {
        console.log("Raw performance metrics:", metrics);
        
        for (const metric of metrics) {
          const name = metric.performance_metrics?.name?.toLowerCase();
          
          // Handle numeric conversion and ensure non-zero values
          if (name === 'revenue') {
            // Convert revenue to numeric value
            result.revenue = metric.actual ? parseFloat(String(metric.actual)) : null;
            console.log(`Processed revenue value: ${result.revenue}`);
          } 
          else if (name === 'gross margin') {
            // Convert gross margin to percentage
            result.gross_margin = metric.actual ? parseFloat(String(metric.actual)) : null;
            console.log(`Processed gross margin value: ${result.gross_margin}`);
          } 
          else if (name === 'cash on hand') {
            // Convert cash value to numeric value 
            result.cash_on_hand = metric.actual ? parseFloat(String(metric.actual)) : null;
            console.log(`Processed cash on hand value: ${result.cash_on_hand}`);
          } 
          else if (name === 'no. of paying customers') {
            // Convert customers to integer
            result.customers = metric.actual ? parseInt(String(metric.actual), 10) : null;
            console.log(`Processed customers value: ${result.customers}`);
          }
        }
      }
      
      console.log("Final processed performance data:", result);
      return result;
    },
    staleTime: 1000 * 30, // 30 seconds (down from Infinity)
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });
  
  // Fetch the latest calculated score
  const { data: latestScore, refetch: refetchScore } = useQuery({
    queryKey: ['startup-score'],
    queryFn: async () => {
      if (!companyData) return null;
      
      const { data, error } = await extendedSupabase
        .from('startup_scores')
        .select('*')
        .eq('company_id', companyData.id)
        .order('calculation_date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      return data as StartupScore | null;
    },
    enabled: !!companyData,
    staleTime: 1000 * 30, // 30 seconds (down from Infinity)
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Auto-calculate score when data is available and no score exists or is zero
  useEffect(() => {
    const autoCalculateInitialScore = async () => {
      // Check ref first to prevent multiple attempts
      if (autoCalculationAttemptedRef.current) {
        return;
      }
      
      if (
        companyData && 
        valuationData && 
        performanceData && 
        (!latestScore || latestScore.total_score === 0) &&
        !loading
      ) {
        // Set ref immediately to prevent concurrent attempts
        autoCalculationAttemptedRef.current = true;
        setAutoCalculationAttempted(true);
        console.log("Auto-calculating initial score ONCE...");
        try {
          setLoading(true);
          const score = await calculateScore();
          
          console.log("Initial score calculated:", score);
          return score;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to calculate initial score';
          console.error("Auto-calculation error:", message);
          setError(message);
        } finally {
          setLoading(false);
        }
      }
    };
    
    autoCalculateInitialScore();
  }, [companyData, valuationData, performanceData, latestScore, loading]);
  
  // Calculate the score
  const calculateScore = async (): Promise<ScoreData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // First, invalidate all queries to ensure we get fresh data
      queryClient.invalidateQueries({ queryKey: ['questionnaire_questions'] });
      queryClient.invalidateQueries({ queryKey: ['performance-metrics-latest'] });
      queryClient.invalidateQueries({ queryKey: ['company-data'] });
      queryClient.invalidateQueries({ queryKey: ['valuation-data'] });
      
      // Force refetch of fresh data to ensure we're using the latest values
      await queryClient.refetchQueries({ queryKey: ['questionnaire_questions'] });
      
      if (!companyData || !valuationData || !performanceData) {
        throw new Error('Missing required data to calculate score');
      }
      
      // ------------------------------------------------
      // PRIORITY DATA SOURCE: Questionnaire responses
      // ------------------------------------------------
      // Fetch questionnaire data first - this is our primary source of truth
      // for financial metrics used in valuation and scoring
      // ------------------------------------------------
      // Get fresh questionnaire data directly (bypassing React Query cache)
      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('questionnaire_questions')
        .select('question_number, response')
        .order('question_number', { ascending: true });

      if (questionnaireError) {
        console.error("Error fetching questionnaire data:", questionnaireError);
      }

      // DETAILED DEBUG: Log the entire questionnaire data to see what we have
      console.log("----------------------------------------");
      console.log("DETAILED QUESTIONNAIRE DEBUG");
      console.log("----------------------------------------");
      console.log("All questions:", questionnaireData?.length || 0, "questions found");
      
      // Log specific key questions for debugging
      console.log("Questionnaire data for debugging:");
      const q61 = questionnaireData?.find(q => q.question_number === "6.1"); // Revenue
      const q63 = questionnaireData?.find(q => q.question_number === "6.3"); // Growth Rate
      const q66 = questionnaireData?.find(q => q.question_number === "6.6"); // Profit Margin
      const q78 = questionnaireData?.find(q => q.question_number === "7.8"); // Expected Valuation
      
      // Also log product-related questions
      const productQuestions = questionnaireData?.filter(q => q.question_number.startsWith("2.")) || [];
      console.log("Product questions found:", productQuestions.length);
      console.log("Product questions data:", productQuestions);
      
      // Log specific key product questions
      const q21 = questionnaireData?.find(q => q.question_number === "2.1");
      const q27 = questionnaireData?.find(q => q.question_number === "2.7");
      const q29 = questionnaireData?.find(q => q.question_number === "2.9");
      
      console.log("Q2.1 Product Stage:", q21 ? `Response: ${q21.response}` : "NOT FOUND");
      console.log("Q2.7 Product-Market Fit:", q27 ? `Response: ${q27.response}` : "NOT FOUND");
      console.log("Q2.9 Scalability:", q29 ? `Response: ${q29.response}` : "NOT FOUND");
      console.log("Revenue (6.1):", q61?.response);
      console.log("Growth Rate (6.3):", q63?.response);
      console.log("Profit Margin (6.6):", q66?.response);
      console.log("Expected Valuation (7.8):", q78?.response);
      console.log("----------------------------------------");

      // ------------------------------------------------
      // Extract values from questionnaire
      // ------------------------------------------------
      
      // Initialize variables to store questionnaire data
      let questionnaireRevenue = 0;
      let questionnaireGrossMargin = 0;
      let questionnaireGrowthRate = 0;
      let questionnaireExpectedValuation = 0;
      let questionnaireProfitMargin = 0;
      let questionnaireCashOnHand = 0;
      let questionnaireTeamSize = 0;
      let questionnaireMarketSize = 0;
      let questionnaireProductReadiness = 0;

      if (questionnaireData) {
        console.log("QUESTIONNAIRE DATA:", questionnaireData);
        
        // Revenue from questionnaire (Q6.1)
        const revenueQuestion = questionnaireData.find(q => q.question_number === "6.1");
        if (revenueQuestion && revenueQuestion.response) {
          questionnaireRevenue = parseFloat(revenueQuestion.response);
          console.log("Found questionnaire revenue:", questionnaireRevenue);
        }

        // Gross margin from questionnaire (Q4.3)
        const grossMarginQuestion = questionnaireData.find(q => q.question_number === "4.3");
        if (grossMarginQuestion && grossMarginQuestion.response) {
          questionnaireGrossMargin = parseFloat(grossMarginQuestion.response);
          console.log("Found questionnaire gross margin:", questionnaireGrossMargin);
        }

        // Growth rate from questionnaire (Q6.3 - Revenue growth rate)
        const growthRateQuestion = questionnaireData.find(q => q.question_number === "6.3");
        if (growthRateQuestion && growthRateQuestion.response) {
          questionnaireGrowthRate = parseFloat(growthRateQuestion.response);
          console.log("Found questionnaire growth rate (Q6.3):", questionnaireGrowthRate);
          
          // Make sure this is assigned to the output data structure
          (performanceData as PerformanceData).growth_rate = questionnaireGrowthRate;
        }
        
        // Expected valuation from questionnaire (Q7.8)
        const expectedValuationQuestion = questionnaireData.find(q => q.question_number === "7.8");
        if (expectedValuationQuestion && expectedValuationQuestion.response) {
          questionnaireExpectedValuation = parseFloat(expectedValuationQuestion.response);
          console.log("Found questionnaire expected valuation (Q7.8):", questionnaireExpectedValuation);
          
          // Convert to larger number if input seems to be in millions
          if (questionnaireExpectedValuation < 1000 && questionnaireExpectedValuation > 0) {
            questionnaireExpectedValuation = questionnaireExpectedValuation * 1000000;
            console.log("Converted expected valuation to:", questionnaireExpectedValuation);
          }
        }

        // Profit margin from questionnaire (Q6.6)
        const profitMarginQuestion = questionnaireData.find(q => q.question_number === "6.6");
        if (profitMarginQuestion && profitMarginQuestion.response) {
          questionnaireProfitMargin = parseFloat(profitMarginQuestion.response);
          console.log("Found questionnaire profit margin (Q6.6):", questionnaireProfitMargin);
        }
        
        // Cash on hand from questionnaire (Q6.2 - Monthly Recurring Revenue)
        const cashQuestion = questionnaireData.find(q => q.question_number === "6.2");
        if (cashQuestion && cashQuestion.response) {
          questionnaireCashOnHand = parseFloat(cashQuestion.response);
          console.log("Found questionnaire cash on hand (MRR):", questionnaireCashOnHand);
        }
        
        // Calculate cash on hand from burn rate and runway
        const burnRateQuestion = questionnaireData.find(q => q.question_number === "6.4");
        const runwayQuestion = questionnaireData.find(q => q.question_number === "6.5");
        
        if (burnRateQuestion && burnRateQuestion.response && 
            runwayQuestion && runwayQuestion.response) {
          const burnRate = parseFloat(burnRateQuestion.response);
          const runway = parseFloat(runwayQuestion.response);
          
          if (!isNaN(burnRate) && !isNaN(runway)) {
            // Calculate cash on hand as burn rate * runway
            const calculatedCashOnHand = burnRate * runway;
            console.log("Calculated cash on hand from burn rate and runway:", calculatedCashOnHand);
            console.log(`Calculation: ${burnRate} (burn rate) * ${runway} (runway) = ${calculatedCashOnHand}`);
            
            // Override the questionnaire cash on hand with the calculated value
            questionnaireCashOnHand = calculatedCashOnHand;
          }
        }
        
        // TEAM SIZE: Combine founders and employees from questionnaire
        const foundersQuestion = questionnaireData.find(q => q.question_number === "1.1");
        const employeesQuestion = questionnaireData.find(q => q.question_number === "1.6");
        console.log("Raw founders question data:", foundersQuestion);
        console.log("Raw employees question data:", employeesQuestion);
        let foundersCount = 0;
        let employeesCount = 0;

        
        if (foundersQuestion && foundersQuestion.response) {
          foundersCount = parseFloat(foundersQuestion.response) || 0;
          console.log("Found questionnaire founders count:", foundersCount);
        }
        
        if (employeesQuestion && employeesQuestion.response) {
          employeesCount = parseFloat(employeesQuestion.response) || 0;
          console.log("Found questionnaire employees count:", employeesCount);
        }
        
        // Total team size is founders + employees
        questionnaireTeamSize = foundersCount + employeesCount;
        console.log("Calculated total team size:", questionnaireTeamSize);
        
        // MARKET SIZE: Extract from TAM question (Q3.1)
        const marketSizeQuestion = questionnaireData.find(q => q.question_number === "3.1");
        if (marketSizeQuestion && marketSizeQuestion.response) {
          // Convert text response to numeric ceiling value
          const marketSizeResponse = marketSizeQuestion.response;
          console.log("Found market size response:", marketSizeResponse);
          
          // Parse the market size range and take the ceiling value
          if (marketSizeResponse.includes("Less Than $100 Million")) {
            questionnaireMarketSize = 100000000; // $100M ceiling
          } else if (marketSizeResponse.includes("$100 Million - $1 Billion")) {
            questionnaireMarketSize = 1000000000; // $1B ceiling
          } else if (marketSizeResponse.includes("$1 Billion - $10 Billion")) {
            questionnaireMarketSize = 10000000000; // $10B ceiling
          } else if (marketSizeResponse.includes("More Than $10 Billion")) {
            questionnaireMarketSize = 20000000000; // $20B estimate for >$10B
          }
          
          console.log("Parsed market size value:", questionnaireMarketSize);
        }

        // PRODUCT READINESS: Calculate from product questions
        console.log("----------------------------------------");
        console.log("PRODUCT READINESS CALCULATION DEBUG INFO");
        console.log("----------------------------------------");
        
        // Product Stage (Q2.1) - weight: 40%
        const productStageQuestion = questionnaireData.find(q => q.question_number === "2.1");
        console.log("Q2.1 Raw Question Data:", productStageQuestion);
        
        let productStageScore = 0;
        if (productStageQuestion && productStageQuestion.response) {
          const stage = productStageQuestion.response;
          console.log("Q2.1 Product Stage Response:", stage);
          
          // Score based on development stage
          if (stage.includes("Idea/Concept Only")) productStageScore = 20;
          else if (stage.includes("Prototype/MVP")) productStageScore = 40;
          else if (stage.includes("Working Product with Limited Features")) productStageScore = 60;
          else if (stage.includes("Complete Product with Full Functionality")) productStageScore = 80;
          else if (stage.includes("Mature Product with Multiple Iterations")) productStageScore = 100;
          console.log("Product stage score assigned:", productStageScore);
        } else {
          console.log("WARNING: No product stage data found in questionnaire!");
        }
        
        // Product-Market Fit (Q2.7) - weight: 30%
        const pmfQuestion = questionnaireData.find(q => q.question_number === "2.7");
        console.log("Q2.7 Raw Question Data:", pmfQuestion);
        
        let pmfScore = 0;
        if (pmfQuestion && pmfQuestion.response) {
          const pmf = pmfQuestion.response;
          console.log("Q2.7 Product-Market Fit Response:", pmf);
          
          // Score based on product-market fit
          if (pmf.includes("No Metrics Yet")) pmfScore = 25;
          else if (pmf.includes("Early Indicators but Not Conclusive")) pmfScore = 50;
          else if (pmf.includes("Strong Evidence of Product-Market Fit")) pmfScore = 75;
          else if (pmf.includes("Clear Product-Market Fit with Retention Data")) pmfScore = 100;
          console.log("Product-market fit score assigned:", pmfScore);
        } else {
          console.log("WARNING: No product-market fit data found in questionnaire!");
        }
        
        // Scalability (Q2.9) - weight: 30%
        const scalabilityQuestion = questionnaireData.find(q => q.question_number === "2.9");
        console.log("Q2.9 Raw Question Data:", scalabilityQuestion);
        
        let scalabilityScore = 0;
        if (scalabilityQuestion && scalabilityQuestion.response) {
          const scalability = scalabilityQuestion.response;
          console.log("Q2.9 Scalability Response:", scalability);
          
          // Score based on scalability
          if (scalability.includes("Difficult to Scale")) scalabilityScore = 25;
          else if (scalability.includes("Moderately Scalable")) scalabilityScore = 50;
          else if (scalability.includes("Highly Scalable")) scalabilityScore = 75;
          else if (scalability.includes("Completely Scalable")) scalabilityScore = 100;
          console.log("Scalability score assigned:", scalabilityScore);
        } else {
          console.log("WARNING: No scalability data found in questionnaire!");
        }
        
        // Calculate weighted product readiness
        console.log("Weighting calculation inputs:", {
          productStageScore, 
          pmfScore, 
          scalabilityScore, 
          weights: {
            productStage: 0.4, 
            pmf: 0.3, 
            scalability: 0.3
          }
        });
        
        // Force calculation of product readiness if any of the scores are available
        if (productStageScore > 0 || pmfScore > 0 || scalabilityScore > 0) {
          // Weighted average: 40% product stage + 30% PMF + 30% scalability
          questionnaireProductReadiness = (productStageScore * 0.4) + (pmfScore * 0.3) + (scalabilityScore * 0.3);
          console.log("Calculated product readiness score:", questionnaireProductReadiness);
          console.log("Calculation breakdown:");
          console.log("- Product Stage:", productStageScore, "* 0.4 =", productStageScore * 0.4);
          console.log("- Product-Market Fit:", pmfScore, "* 0.3 =", pmfScore * 0.3);
          console.log("- Scalability:", scalabilityScore, "* 0.3 =", scalabilityScore * 0.3);
          console.log("- Total:", questionnaireProductReadiness);
        } else {
          console.log("WARNING: No product data available for calculation, using default value");
        }
        console.log("----------------------------------------");
      }
      
      // ------------------------------------------------
      // IMPORTANT: Data Priority Order
      // 1. Questionnaire values (primary source of truth)
      // 2. Default values (last resort)
      // ------------------------------------------------
      
      // Create a company data object that uses team size from questionnaire or default
      const processedCompanyData = {
        ...companyData, // Keep other properties for context
        // For team size: Questionnaire > Default (no fallback to companyData)
        total_employees: questionnaireTeamSize !== null && questionnaireTeamSize !== 0 ? 
                        questionnaireTeamSize : 
                        15 // Default
      };
      
      // Prepare performance data with questionnaire values taking precedence
      console.log("----------------------------------------");
      console.log("PERFORMANCE DATA PREPARATION DEBUG INFO");
      console.log("----------------------------------------");
      console.log("Original performance data:", performanceData);
      console.log("Questionnaire product readiness:", questionnaireProductReadiness);
      
      const processedPerformanceData = {
        // For revenue: Questionnaire > Default (no fallback to performanceData)
        revenue: questionnaireRevenue !== null && questionnaireRevenue !== 0 ? 
                 questionnaireRevenue : 
                 3234, // Default
        
        // For gross margin: Questionnaire > Default (no fallback to performanceData)
        gross_margin: questionnaireGrossMargin !== null && questionnaireGrossMargin !== 0 ? 
                     questionnaireGrossMargin : 
                     31, // Default
        
        // For cash on hand: Questionnaire > Default (no fallback to performanceData)
        cash_on_hand: questionnaireCashOnHand !== null && questionnaireCashOnHand !== 0 ? 
                     questionnaireCashOnHand : 
                     134, // Default
        
        // For customers: Default value only (no fallback to performanceData)
        customers: 700, // Default
        
        // For market size: Questionnaire > Default (no fallback to performanceData)
        market_size: questionnaireMarketSize !== null && questionnaireMarketSize !== 0 ?
                    questionnaireMarketSize :
                    4000000, // Default
        
        // For product readiness: Questionnaire > Default (no fallback to performanceData)
        product_readiness: questionnaireProductReadiness !== null && questionnaireProductReadiness !== 0 ?
                          questionnaireProductReadiness :
                          75, // Default
        
        // For growth rate: Questionnaire > Default (no fallback to performanceData)
        growth_rate: questionnaireGrowthRate !== null && questionnaireGrowthRate !== 0 ?
                   questionnaireGrowthRate :
                   33 // Default
      };
      
      console.log("Processed performance data:", processedPerformanceData);
      console.log("Final product_readiness value:", processedPerformanceData.product_readiness);
      console.log("Final product_readiness type:", typeof processedPerformanceData.product_readiness);
      console.log("----------------------------------------");

      // Use questionnaire data with direct defaults (no fallback to valuationData)
      const processedValuationData = {
        // For pre-money valuation: Questionnaire > Default (no fallback to valuationData)
        pre_money_valuation: questionnaireExpectedValuation !== null && questionnaireExpectedValuation !== 0 ?
                            questionnaireExpectedValuation :
                            64000, // Default
        
        // For selected valuation: Questionnaire > Default (no fallback to valuationData)
        selected_valuation: questionnaireExpectedValuation !== null && questionnaireExpectedValuation !== 0 ? 
                           questionnaireExpectedValuation : 
                           64000, // Default
        
        // For annual ROI: Profit margin from questionnaire > Growth rate from questionnaire > Default
        annual_roi: questionnaireProfitMargin !== null && questionnaireProfitMargin !== 0 ? 
                   questionnaireProfitMargin : 
                   (questionnaireGrowthRate !== null && questionnaireGrowthRate !== 0 ? 
                   questionnaireGrowthRate : 
                   33) // Default
      };
      
      console.log("Using company data (prioritizing questionnaire):", processedCompanyData);
      console.log("Using performance data (prioritizing questionnaire):", processedPerformanceData);
      console.log("Using valuation data (prioritizing questionnaire):", processedValuationData);
      
      const score = await calculateStartupScore(
        processedCompanyData,
        processedPerformanceData,
        processedValuationData
      );
      
      // Save the score
      try {
        await saveStartupScore(companyData.id, score);
        console.log("Score saved successfully");
      } catch (saveError) {
        console.error("Error saving score to database:", saveError);
        // Continue with the score calculation even if saving fails
      }
      
      // Invalidate query to force re-fetch
      queryClient.invalidateQueries({ queryKey: ['startup-score'] });
      // Force refetch to get the latest data
      await queryClient.refetchQueries({ queryKey: ['startup-score'] });
      
      console.log("Score calculated:", score);
      return score;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate score';
      console.error(message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    score: latestScore,
    loading,
    error,
    calculateScore,
    refetchScore,
    latestCalculationDate: latestScore?.calculation_date || null,
    companyData, // Expose company data for the UI
  };
}
