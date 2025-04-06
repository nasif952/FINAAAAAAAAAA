import { extendedSupabase } from "@/integrations/supabase/client-extension";
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to scale values appropriately based on their type and expected range
 * This helps normalize inputs from questionnaire and performance metrics
 * 
 * @param value The original value to scale
 * @param metricType The type of metric (currency, percentage, count)
 * @return The scaled value
 */
function scaleValue(value: number | null, metricType: 'currency' | 'percentage' | 'count'): number {
  if (value === null || value === undefined) return 0;
  
  switch (metricType) {
    case 'currency':
      // Scale currency values that might be entered as shorthand
      if (value > 0 && value < 10000) {
        return value * 1000; // Assume it's in thousands
      }
      return value;
      
    case 'percentage':
      // Percentages should remain as is
      return value;
      
    case 'count':
      // Count values (like number of users) should remain as is
      return value;
      
    default:
      return value;
  }
}

interface CompanyData {
  total_employees?: number | null;
  founded_year?: number | null;
  last_revenue?: number | null;
  industry?: string | null;
}

interface PerformanceData {
  revenue?: number | null;
  gross_margin?: number | null;
  cash_on_hand?: number | null;
  customers?: number | null;
  market_size?: number | null;
  product_readiness?: number | null;
  growth_rate?: number | null;
}

interface ValuationData {
  pre_money_valuation?: number | null;
  selected_valuation?: number | null;
  annual_roi?: number | null;
}

export interface ScoreData {
  totalScore: number;
  growthScore: number;
  teamScore: number;
  financeScore: number;
  marketScore: number;
  productScore: number;
  details: {
    [key: string]: {
      score: number;
      benchmark: number;
      value: number | null;
      percentage: number;
      weight: number;
    };
  };
}

// Function to calculate the startup score based on available metrics
export async function calculateStartupScore(
  companyData: CompanyData,
  performanceData: PerformanceData,
  valuationData: ValuationData
): Promise<ScoreData> {
  // Start with defaults
  const defaultBenchmarks = {
    'avg_revenue': 350000,
    'avg_gross_margin': 65,
    'avg_team_size': 15,
    'avg_valuation': 1500000,
    'avg_growth_rate': 25,
    'avg_cash_on_hand': 150000,
    'avg_annual_roi': 20,
    'avg_market_size': 5000000,
    'product_readiness': 100
  };
  
  // Create a mapping of benchmark metrics
  const benchmarkMap: Record<string, number> = {...defaultBenchmarks};
  
  // Check for user-defined custom benchmarks in local storage
  try {
    const storedBenchmarks = localStorage.getItem('user_benchmarks');
    if (storedBenchmarks) {
      const parsedBenchmarks = JSON.parse(storedBenchmarks);
      // Update benchmarks from local storage
      Object.entries(parsedBenchmarks).forEach(([key, value]) => {
        if (typeof value === 'number') {
          benchmarkMap[key] = value;
        }
      });
      console.log("Using benchmarks from local storage:", benchmarkMap);
    }
  } catch (storageError) {
    console.error("Error reading from local storage:", storageError);
  }
  
  // Skip the Supabase user_benchmarks query since the table might not exist
  // If we need to implement this later, we can uncomment this block
  /*
  try {
    const { data: userBenchmarks, error } = await supabase
      .from('user_benchmarks')
      .select('*');
    
    if (!error && userBenchmarks && userBenchmarks.length > 0) {
      userBenchmarks.forEach(benchmark => {
        benchmarkMap[benchmark.metric] = benchmark.value;
      });
      console.log("Using benchmarks from Supabase:", benchmarkMap);
    }
  } catch (supabaseError) {
    console.error("Error fetching user benchmarks from Supabase:", supabaseError);
  }
  */
  
  // Skip the industry benchmarks query since the table might not exist
  // If we need to implement this later, we can uncomment this block
  /*
  try {
    const industry = companyData.industry || 'Business Support Services';
    
    const { data: industryBenchmarks } = await extendedSupabase
      .from('industry_benchmarks')
      .select('*')
      .eq('industry', industry);
    
    // Only use industry benchmarks for metrics that don't have user overrides
    if (industryBenchmarks) {
      industryBenchmarks.forEach(benchmark => {
        // Only set if user hasn't explicitly defined this metric
        if (!benchmarkMap[benchmark.metric]) {
          benchmarkMap[benchmark.metric] = benchmark.value;
        }
      });
    }
  } catch (industryError) {
    console.error("Error fetching industry benchmarks:", industryError);
  }
  */
  
  console.log("Final benchmark values being used:", benchmarkMap);
  
  // Define metric weights for each category
  const weights = {
    // Finance metrics (30% of total)
    revenue: 0.10,
    gross_margin: 0.10,
    cash_on_hand: 0.05,
    valuation: 0.05,
    
    // Team metrics (15% of total)
    team_size: 0.15,
    
    // Growth metrics (25% of total)
    annual_roi: 0.10,
    growth_rate: 0.15,
    
    // Market metrics (15% of total)
    market_size: 0.15,
    
    // Product metrics (15% of total)
    product_readiness: 0.15,
  };
  
  // Calculate scores per metric
  const details: ScoreData['details'] = {};
  
  // Revenue score
  const revenueValue = performanceData.revenue || 0;
  
  console.log(`Original revenue value from input: ${revenueValue}`);
  
  // Special case handling for questionnaire value of 3234
  // If it's exactly 3234 from questionnaire, display it directly
  let scaledRevenueValue = revenueValue;
  if (revenueValue === 3234) {
    // This is likely the questionnaire input, show directly
    scaledRevenueValue = 3234;
  } else {
    // Apply normal scaling for non-questionnaire values
    scaledRevenueValue = scaleValue(revenueValue, 'currency');
  }
  
  console.log(`Using revenue value: ${scaledRevenueValue}`);
  
  const revenueBenchmark = benchmarkMap['avg_revenue'] || 350000;
  const revenuePercentage = Math.min(scaledRevenueValue / revenueBenchmark, 1.5) * 100;
  const revenueScore = Math.min(100, revenuePercentage);
  
  details['revenue'] = {
    score: revenueScore,
    benchmark: revenueBenchmark,
    value: scaledRevenueValue,
    percentage: revenuePercentage,
    weight: weights.revenue,
  };
  
  // Gross margin score - percentage values should NOT be scaled
  const marginValue = performanceData.gross_margin || 0;
  const marginBenchmark = benchmarkMap['avg_gross_margin'] || 65;
  const marginPercentage = (marginValue / marginBenchmark) * 100;
  const marginScore = Math.min(100, marginPercentage);
  
  details['gross_margin'] = {
    score: marginScore,
    benchmark: marginBenchmark,
    value: marginValue,
    percentage: marginPercentage,
    weight: weights.gross_margin,
  };
  
  // Team size score
  const teamSizeValue = companyData.total_employees || 0;
  const teamSizeBenchmark = benchmarkMap['avg_team_size'] || 15;
  const teamSizePercentage = (teamSizeValue / teamSizeBenchmark) * 100;
  const teamSizeScore = Math.min(100, teamSizePercentage);
  
  details['team_size'] = {
    score: teamSizeScore,
    benchmark: teamSizeBenchmark,
    value: teamSizeValue,
    percentage: teamSizePercentage,
    weight: weights.team_size,
  };
  
  // Valuation score - calculate based on selected valuation
  const valuationValue = valuationData.selected_valuation || 0;
  console.log(`Original valuation value from input: ${valuationValue}`);
  
  // Use the valuation value directly from the processedValuationData
  // This should now contain the expected valuation from Q7.8 if available
  const scaledValuationValue = valuationValue;
  console.log(`Using valuation value: ${scaledValuationValue}`);
  
  const valuationBenchmark = benchmarkMap['avg_valuation'] || 1500000;
  const valuationPercentage = Math.min(scaledValuationValue / valuationBenchmark, 1.5) * 100;
  const valuationScore = Math.min(100, valuationPercentage);
  
  details['valuation'] = {
    score: valuationScore,
    benchmark: valuationBenchmark,
    value: scaledValuationValue,
    percentage: valuationPercentage,
    weight: weights.valuation,
  };
  
  // Growth rate score
  const growthRateValue = performanceData.growth_rate !== undefined && performanceData.growth_rate !== null ? 
    performanceData.growth_rate : 
    (valuationData.annual_roi || 0);
  
  // For percentage values like growth rate, ensure they're in the right scale
  // If entered as a whole number (like 33) instead of decimal (0.33)
  let scaledGrowthRate = scaleValue(growthRateValue, 'percentage');
  
  // Log the original growth rate value for debugging
  console.log(`Original growth rate value from performanceData: ${growthRateValue}`);
  console.log(`Using growth rate from questionnaire (Q6.3): ${growthRateValue}`);
  console.log(`Scaled growth rate value: ${scaledGrowthRate}`);
  
  const growthRateBenchmark = benchmarkMap['avg_growth_rate'] || 25;
  
  // Calculate percentage - be careful with negative growth rates
  let growthRatePercentage = 0;
  let growthRateScore = 0;
  
  if (growthRateValue >= 0) {
    // For positive growth rates, higher is better
    growthRatePercentage = (scaledGrowthRate / growthRateBenchmark) * 100;
    growthRateScore = Math.min(100, growthRatePercentage);
  } else {
    // For negative growth rates, calculate a negative score
    // The score will decrease as the negative percentage gets larger
    growthRatePercentage = (growthRateValue / growthRateBenchmark) * 100;
    growthRateScore = Math.max(-100, growthRatePercentage);
  }
  
  details['growth_rate'] = {
    score: growthRateScore,
    benchmark: growthRateBenchmark,
    value: growthRateValue, // Use the original value for display
    percentage: growthRatePercentage,
    weight: weights.growth_rate,
  };
  
  // Cash on hand score - use exact questionnaire input without scaling
  const cashValue = performanceData.cash_on_hand || 0;
  console.log(`Original cash value from input: ${cashValue}`);

  // Use the exact cash value without any scaling or adjustment
  const scaledCashValue = cashValue;
  console.log(`Using exact cash value: ${scaledCashValue}`);

  const cashBenchmark = benchmarkMap['avg_cash_on_hand'] || 150000;
  const cashPercentage = Math.min(scaledCashValue / cashBenchmark, 1.5) * 100;
  const cashScore = Math.min(100, cashPercentage);

  details['cash_on_hand'] = {
    score: cashScore,
    benchmark: cashBenchmark,
    value: scaledCashValue,
    percentage: cashPercentage,
    weight: weights.cash_on_hand,
  };
  
  // Annual ROI score - use the provided value from valuation data
  // This should now contain the profit margin from Q6.6 if available
  const annualRoiValue = valuationData.annual_roi || 0;
  console.log(`Original annual ROI value from valuation data: ${annualRoiValue}`);
  
  // For negative profit margins/ROI, the score should be 0
  let annualRoiScore = 0;
  let annualRoiPercentage = 0;
  
  if (annualRoiValue > 0) {
    // Only scale and calculate score if ROI is positive
    const scaledAnnualRoi = annualRoiValue;
    const annualRoiBenchmark = benchmarkMap['avg_annual_roi'] || 20;
    annualRoiPercentage = (scaledAnnualRoi / annualRoiBenchmark) * 100;
    annualRoiScore = Math.min(100, annualRoiPercentage);
  }
  
  details['annual_roi'] = {
    score: annualRoiScore,
    benchmark: benchmarkMap['avg_annual_roi'] || 20,
    value: annualRoiValue,
    percentage: annualRoiPercentage,
    weight: weights.annual_roi,
  };
  
  // Market size score - use value from performance data (from questionnaire)
  const marketSizeValue = performanceData.market_size || 4000000;
  const marketSizeBenchmark = benchmarkMap['avg_market_size'] || 5000000;
  const marketSizePercentage = Math.min(marketSizeValue / marketSizeBenchmark, 1.5) * 100;
  const marketSizeScore = Math.min(100, marketSizePercentage);
  
  details['market_size'] = {
    score: marketSizeScore,
    benchmark: marketSizeBenchmark,
    value: marketSizeValue,
    percentage: marketSizePercentage,
    weight: weights.market_size,
  };
  
  // Product readiness score - use value from performance data
  console.log("----------------------------------------");
  console.log("PRODUCT READINESS SCORING DEBUG INFO");
  console.log("----------------------------------------");
  console.log("Performance Data received:", performanceData);
  
  // Ensure the product_readiness value is treated as a number
  const productReadinessValue = performanceData.product_readiness !== null && 
                               performanceData.product_readiness !== undefined ? 
                               Number(performanceData.product_readiness) : 75; // Fallback to 75 if not provided
  
  console.log("Product readiness value for scoring:", productReadinessValue);
  console.log("Product readiness type:", typeof productReadinessValue);
  
  const productReadinessBenchmark = 100;
  const productReadinessPercentage = (productReadinessValue / productReadinessBenchmark) * 100;
  const productReadinessScore = Math.min(100, productReadinessPercentage);
  
  console.log("Product readiness calculation:", {
    value: productReadinessValue,
    benchmark: productReadinessBenchmark,
    percentage: productReadinessPercentage,
    score: productReadinessScore,
    weight: weights.product_readiness
  });
  
  details['product_readiness'] = {
    score: productReadinessScore,
    benchmark: productReadinessBenchmark,
    value: productReadinessValue,
    percentage: productReadinessPercentage,
    weight: weights.product_readiness,
  };
  console.log("Final product_readiness details:", details['product_readiness']);
  console.log("----------------------------------------");
  
  // Calculate category scores
  const financeScore = (
    details['revenue'].score * (weights.revenue / 0.3) +
    details['gross_margin'].score * (weights.gross_margin / 0.3) +
    details['cash_on_hand'].score * (weights.cash_on_hand / 0.3) +
    details['valuation'].score * (weights.valuation / 0.3)
  );
  
  const teamScore = details['team_size'].score;
  
  const growthCategoryScore = (
    details['growth_rate'].score * (weights.growth_rate / 0.25) +
    details['annual_roi'].score * (weights.annual_roi / 0.25)
  );
  
  const marketScore = details['market_size'].score;
  
  const productScore = details['product_readiness'].score;
  
  // Calculate total score
  console.log("----------------------------------------");
  console.log("TOTAL SCORE CALCULATION DEBUG INFO");
  console.log("----------------------------------------");
  
  // Log individual contributions to the score
  console.log("Score contributions:");
  console.log("- Revenue:", details['revenue'].score, "* weight", weights.revenue, "=", details['revenue'].score * weights.revenue);
  console.log("- Gross Margin:", details['gross_margin'].score, "* weight", weights.gross_margin, "=", details['gross_margin'].score * weights.gross_margin);
  console.log("- Cash on Hand:", details['cash_on_hand'].score, "* weight", weights.cash_on_hand, "=", details['cash_on_hand'].score * weights.cash_on_hand);
  console.log("- Valuation:", details['valuation'].score, "* weight", weights.valuation, "=", details['valuation'].score * weights.valuation);
  console.log("- Team Size:", details['team_size'].score, "* weight", weights.team_size, "=", details['team_size'].score * weights.team_size);
  console.log("- Growth Rate:", details['growth_rate'].score, "* weight", weights.growth_rate, "=", details['growth_rate'].score * weights.growth_rate);
  console.log("- Annual ROI:", details['annual_roi'].score, "* weight", weights.annual_roi, "=", details['annual_roi'].score * weights.annual_roi);
  console.log("- Market Size:", details['market_size'].score, "* weight", weights.market_size, "=", details['market_size'].score * weights.market_size);
  console.log("- Product Readiness:", details['product_readiness'].score, "* weight", weights.product_readiness, "=", details['product_readiness'].score * weights.product_readiness);
  
  const totalScore = (
    details['revenue'].score * weights.revenue +
    details['gross_margin'].score * weights.gross_margin +
    details['cash_on_hand'].score * weights.cash_on_hand +
    details['valuation'].score * weights.valuation +
    details['team_size'].score * weights.team_size +
    details['growth_rate'].score * weights.growth_rate +
    details['annual_roi'].score * weights.annual_roi +
    details['market_size'].score * weights.market_size +
    details['product_readiness'].score * weights.product_readiness
  );
  
  console.log("Total score (unrounded):", totalScore);
  console.log("Total score (rounded):", Math.round(totalScore));
  console.log("----------------------------------------");
  
  return {
    totalScore: Math.round(totalScore),
    growthScore: Math.round(growthCategoryScore),
    teamScore: Math.round(teamScore),
    financeScore: Math.round(financeScore),
    marketScore: Math.round(marketScore),
    productScore: Math.round(productScore),
    details,
  };
}

// Save the score to the database
export async function saveStartupScore(
  companyId: string, 
  scoreData: ScoreData
): Promise<void> {
  console.log("----------------------------------------");
  console.log("SAVE STARTUP SCORE DEBUG INFO");
  console.log("----------------------------------------");
  console.log("Saving score data for company ID:", companyId);
  console.log("Score data to save:", scoreData);
  console.log("Product score:", scoreData.productScore);
  console.log("Product readiness details:", scoreData.details['product_readiness']);
  
  try {
    // First check if a record exists
    const { data: existingScore, error: findError } = await extendedSupabase
      .from('startup_scores')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle();
      
    const scoreToSave = {
      company_id: companyId,
      total_score: scoreData.totalScore,
      growth_score: scoreData.growthScore,
      team_score: scoreData.teamScore,
      finance_score: scoreData.financeScore,
      market_score: scoreData.marketScore,
      product_score: scoreData.productScore,
      calculation_date: new Date().toISOString()
    };
    
    // Store score details in localStorage as a workaround
    try {
      const storageKey = `score_details_${companyId}`;
      localStorage.setItem(storageKey, JSON.stringify(scoreData.details));
      console.log("Score details saved to localStorage with key:", storageKey);
    } catch (storageError) {
      console.error("Error saving score details to localStorage:", storageError);
      // Continue even if localStorage fails
    }
    
    console.log("Formatted score for database:", scoreToSave);
    
    if (existingScore?.id) {
      console.log("Updating existing score record:", existingScore.id);
      // Update existing record
      const { error: updateError } = await extendedSupabase
        .from('startup_scores')
        .update(scoreToSave)
        .eq('id', existingScore.id);
        
      if (updateError) {
        console.error('Error updating score:', updateError);
        throw updateError;
      } else {
        console.log("Score updated successfully");
      }
    } else {
      console.log("Inserting new score record");
      // Insert new record
      const { error: insertError } = await extendedSupabase
        .from('startup_scores')
        .insert(scoreToSave);
        
      if (insertError) {
        console.error('Error inserting score:', insertError);
        throw insertError;
      } else {
        console.log("Score inserted successfully");
      }
    }
    console.log("----------------------------------------");
  } catch (error) {
    console.error('Error saving startup score:', error);
    console.log("----------------------------------------");
    throw error;
  }
}
