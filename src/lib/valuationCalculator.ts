import { supabase } from '@/integrations/supabase/client';

// Define interfaces needed from useValuation hook
interface CompanyData {
  id: string;
  name: string;
  founded_year: number | null;
  total_employees: number | null;
  industry: string | null;
  business_activity: string | null;
  last_revenue: number | null;
  stage: string | null;
}

interface ValuationData {
  id: string;
  selected_valuation: number | null;
  initial_estimate: number | null;
  pre_money_valuation: number | null;
  investment: number | null;
  post_money_valuation: number | null;
  valuation_min: number;
  valuation_max: number;
  funds_raised: number | null;
  last_year_ebitda: number | null;
  industry_multiple: number | null;
  annual_roi: number | null; // Required ROI / Growth Rate
  calculation_date?: string | null; 
  companies: CompanyData | null; // This is nested, use companyData directly
}

// Type for questionnaire questions with responses (REMOVED - No longer needed)
// interface QuestionWithResponse { ... } 

// Valuation method weights structure
interface ValuationWeights {
  [key: string]: {
    weight: number;
    enabled: boolean;
  }
}

// Structure for valuation results
export interface ValuationResults {
  scorecard: number;
  checklistMethod: number;
  ventureCap: number;
  dcfGrowth: number;
  dcfMultiple: number;
  combinedValuation: number;
  methodologyWeights: ValuationWeights;
}

// REMOVED fetchQuestionnaireData function
// REMOVED fetchGrowthRateFromQuestionnaire function

// Calculate valuation based on DB data fields
export async function calculateValuation(
  valuationData: ValuationData, 
  companyData: CompanyData
): Promise<ValuationResults> {
  try {
    console.log(`Starting valuation calculation using DB data for valuation ID: ${valuationData.id}, company ID: ${companyData.id}`);
    
    const stage = companyData?.stage?.toLowerCase() || 'seed';
    console.log(`Company stage detected: ${stage}`);
    
    // Get default methodology weights based on stage
    const weights = getDefaultWeights(stage);
    
    // --- NO LONGER FETCHING QUESTIONNAIRE ---
    // const questions = await fetchQuestionnaireData(valuationId); 
    // console.log(`Retrieved ${questions.length} questions for valuation`);
    
    // --- NO LONGER FETCHING GROWTH RATE SEPARATELY ---
    // const growthRate = await fetchGrowthRateFromQuestionnaire();
    // if (growthRate !== null) { ... update annual_roi ... } 
    // We will now use valuationData.annual_roi directly where needed

    // Calculate valuation using different methods, passing DB data
    const scorecardValue = calculateScorecardMethod(valuationData, companyData);
    const checklistValue = calculateChecklistMethod(valuationData, companyData);
    const ventureCapValue = calculateVentureCapMethod(valuationData, companyData);
    const dcfGrowthValue = calculateDCFGrowthMethod(valuationData, companyData);
    const dcfMultipleValue = calculateDCFMultipleMethod(valuationData, companyData);
    
    console.log("Individual method calculations (from DB data):", {
      scorecard: scorecardValue,
      checklist: checklistValue,
      ventureCap: ventureCapValue,
      dcfGrowth: dcfGrowthValue,
      dcfMultiple: dcfMultipleValue
    });
    
    // --- COMBINED VALUATION LOGIC (Remains the same) ---
    const enabledMethods = Object.entries(weights)
      .filter(([_, config]) => config.enabled)
      .map(([method, config]) => ({ method, weight: config.weight }));
      
    const totalWeight = enabledMethods.reduce((sum, item) => sum + item.weight, 0);
    
    const methodValues = {
      scorecard: scorecardValue,
      checklistMethod: checklistValue, // Ensure key matches the result property name
      ventureCap: ventureCapValue,
      dcfGrowth: dcfGrowthValue,
      dcfMultiple: dcfMultipleValue
    };
    
    const normalizedMethodValues = normalizeValuationMethodValues(methodValues);
    
    let combinedValuation = 0;
    if (totalWeight > 0) {
      combinedValuation = (
        (normalizedMethodValues.scorecard * (weights.scorecard.enabled ? weights.scorecard.weight : 0)) +
        (normalizedMethodValues.checklistMethod * (weights.checklistMethod.enabled ? weights.checklistMethod.weight : 0)) +
        (normalizedMethodValues.ventureCap * (weights.ventureCap.enabled ? weights.ventureCap.weight : 0)) +
        (normalizedMethodValues.dcfGrowth * (weights.dcfGrowth.enabled ? weights.dcfGrowth.weight : 0)) +
        (normalizedMethodValues.dcfMultiple * (weights.dcfMultiple.enabled ? weights.dcfMultiple.weight : 0))
      ) / totalWeight;
    }
    
    console.log("Normalized method values:", normalizedMethodValues);
    console.log(`Combined valuation calculated: ${combinedValuation}`);
    
    return {
      scorecard: scorecardValue,
      checklistMethod: checklistValue,
      ventureCap: ventureCapValue,
      dcfGrowth: dcfGrowthValue,
      dcfMultiple: dcfMultipleValue,
      combinedValuation: combinedValuation,
      methodologyWeights: weights
    };
  } catch (error) {
    console.error("Error in valuation calculation:", error);
    return getDefaultValuationResults(companyData?.stage?.toLowerCase() || 'seed'); // Use provided stage for default
  }
}

// Update the valuation in the database (Signature remains the same, logic mostly same)
export async function updateValuationWithResults(
  valuationId: string, 
  results: ValuationResults,
  manuallySelectedValue?: number 
): Promise<void> {
  try {
    console.log(`Updating valuation ${valuationId} with results:`, results);
    
    // Use manually specified value first, otherwise use calculation result
    // If selected value was passed, use it, otherwise use the new combined calculation
    const selectedValuation = manuallySelectedValue !== undefined 
      ? manuallySelectedValue 
      : results.combinedValuation; 
      
    console.log("DEBUG: Using selected_valuation for update:", selectedValuation);
    
    // Update pre-money, investment, post-money based on the selected value
    const investmentPercentage = 0.15; // Keep consistent with useValuation hook logic
    const investment = selectedValuation * investmentPercentage;
    const postMoney = selectedValuation + investment;
      
    const { data, error } = await supabase
      .from('valuations')
      .update({
        selected_valuation: selectedValuation,
        pre_money_valuation: selectedValuation, // Pre-money IS the selected valuation
        investment: investment,
        post_money_valuation: postMoney,
        // NOTE: We are NOT updating annual_roi, industry_multiple, last_year_ebitda here.
        // These should ideally come from the 'Update Metrics' section or company data.
        // The 'annual_roi' update based on questionnaire Q6.6 was removed from calculateValuation.
      })
      .eq('id', valuationId)
      .select(); // select() might not be necessary for just an update
      
    if (error) {
      console.error("Error updating valuation with results:", error);
      throw error;
    }
    
    console.log("Valuation DB record updated successfully (Selected, Pre, Invest, Post)");
  } catch (error) {
    console.error("Failed to update valuation with results:", error);
    throw error; // Rethrow to be caught by mutation's onError
  }
}

// Function to get default weights based on company stage (Remains the same)
function getDefaultWeights(stage: string): ValuationWeights {
  switch(stage.toLowerCase()) {
    case 'pre-seed':
    case 'angel':
      return {
        scorecard: { weight: 40, enabled: true },
        checklistMethod: { weight: 40, enabled: true },
        ventureCap: { weight: 20, enabled: true },
        dcfGrowth: { weight: 0, enabled: false },
        dcfMultiple: { weight: 0, enabled: false }
      };
    case 'seed':
      return {
        scorecard: { weight: 30, enabled: true },
        checklistMethod: { weight: 30, enabled: true },
        ventureCap: { weight: 20, enabled: true },
        dcfGrowth: { weight: 10, enabled: true },
        dcfMultiple: { weight: 10, enabled: true }
      };
    case 'growth':
    case 'series a':
      return {
        scorecard: { weight: 10, enabled: true },
        checklistMethod: { weight: 10, enabled: true },
        ventureCap: { weight: 20, enabled: true },
        dcfGrowth: { weight: 30, enabled: true },
        dcfMultiple: { weight: 30, enabled: true }
      };
    default:
      return {
        scorecard: { weight: 20, enabled: true },
        checklistMethod: { weight: 20, enabled: true },
        ventureCap: { weight: 20, enabled: true },
        dcfGrowth: { weight: 20, enabled: true },
        dcfMultiple: { weight: 20, enabled: true }
      };
  }
}


// --- REWRITTEN VALUATION METHOD IMPLEMENTATIONS ---

// NOTE: These are simplified interpretations based on DB fields. 
// The original logic mapping questionnaire answers was complex and 
// might need more nuanced translation based on business requirements.

function calculateScorecardMethod(valuationData: ValuationData, companyData: CompanyData): number {
  console.log("Calculating Scorecard using DB data...");
  const baseValuation = 5000000; // Keep base comparison
  
  // Simplified factors based on available DB data:
  // Use total_employees for team size proxy
  const teamScore = Math.min(1, (companyData.total_employees || 1) / 50); // Cap at 50 employees = score 1
  
  // Use industry/activity for market/product proxy (very simplified)
  const marketProductScore = (companyData.industry?.toLowerCase().includes('tech') || companyData.business_activity?.toLowerCase().includes('saas')) ? 0.7 : 0.4;
  
  // Use last_revenue/annual_roi for financials proxy
  const financialScore = Math.min(1, ((valuationData.annual_roi || 0) + 100) / 200) * 0.5 + // ROI contributes 50%
                         Math.min(1, (companyData.last_revenue || 0) / 1000000) * 0.5; // Revenue contributes 50% (cap at $1M)
                         
  // Simplified weights: Team 30%, Market/Product 30%, Financials 40%
  const weightedRating = teamScore * 0.3 + marketProductScore * 0.3 + financialScore * 0.4;
  
  const result = baseValuation * weightedRating;
  console.log(`Scorecard Result: ${result} (Rating: ${weightedRating.toFixed(3)})`);
  return result;
}

function calculateChecklistMethod(valuationData: ValuationData, companyData: CompanyData): number {
  console.log("Calculating Checklist using DB data...");
  const baseValuation = 7500000; 
  let totalAdjustment = 0;

  // Team Strength (based on employees)
  const teamRating = Math.min(1, (companyData.total_employees || 1) / 50);
  totalAdjustment += -0.5 + (1.5 * teamRating); // Range [-0.5, 1.0]

  // Product Stage (based on company stage)
  const stageMap: { [key: string]: number } = { 'pre-seed': 0.1, 'seed': 0.3, 'growth': 0.7, 'series a': 0.9 };
  const stageRating = stageMap[companyData.stage?.toLowerCase() || 'seed'] || 0.3;
  totalAdjustment += -0.5 + (1.5 * stageRating); // Range [-0.5, 1.0]

  // Market Size/Revenue Potential (based on revenue)
  const revenueRating = Math.min(1, (companyData.last_revenue || 0) / 2000000); // Cap at $2M
  totalAdjustment += -0.25 + (1.25 * revenueRating); // Range [-0.25, 1.0]
  
  // Simplified/omitted: Competition, Marketing, Need for Investment factors

  const result = baseValuation * (1 + totalAdjustment);
  console.log(`Checklist Result: ${result} (Adjustment: ${totalAdjustment.toFixed(3)})`);
  return result;
}

function calculateVentureCapMethod(valuationData: ValuationData, companyData: CompanyData): number {
  console.log("Calculating Venture Cap using DB data...");
  const lastYearRevenue = companyData.last_revenue || 0;
  // Use annual_roi from valuationData as growth rate proxy
  const growthRate = valuationData.annual_roi || 0; 

  // Calculate valuation based on revenue multiples
  const revenueMultiple = calculateRevenueMultiple(growthRate); // Helper remains same
  
  // Use current revenue * (1 + growth) as projection
  const projectedRevenue = lastYearRevenue * (1 + (growthRate / 100));
  
  const result = projectedRevenue * revenueMultiple;
  console.log(`Venture Cap Result: ${result} (Revenue: ${lastYearRevenue}, Growth: ${growthRate}%, Multiple: ${revenueMultiple})`);
  return result;
}

function calculateDCFGrowthMethod(valuationData: ValuationData, companyData: CompanyData): number {
  console.log("Calculating DCF Growth using DB data...");
  const lastYearRevenue = companyData.last_revenue || 0;
  // Use annual_roi as growth rate
  const growthRate = valuationData.annual_roi || 20; // Default 20% if null/0
  // Estimate profit margin based on EBITDA / Revenue, default 15%
  let profitMargin = 15; 
  if (valuationData.last_year_ebitda && lastYearRevenue > 0) {
      profitMargin = (valuationData.last_year_ebitda / lastYearRevenue) * 100;
  }
  profitMargin = Math.max(profitMargin, 5); // Ensure minimum 5% margin for calculation
  
  // --- DCF Calculation logic (remains similar, inputs changed) ---
  const discountRate = 0.25; 
  const terminalMultiple = 10; 
  const projectionYears = 5; 
  
  let valuation = 0;
  let currentRevenue = lastYearRevenue;
  
  for (let year = 1; year <= projectionYears; year++) {
    currentRevenue *= (1 + (growthRate / 100));
    const cashFlow = currentRevenue * (profitMargin / 100);
    const discountFactor = Math.pow(1 + discountRate, year);
    valuation += cashFlow / discountFactor;
  }
  
  const terminalCashFlow = currentRevenue * (profitMargin / 100) * (1 + 0.03); 
  const terminalValue = terminalCashFlow * terminalMultiple;
  const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, projectionYears);
  
  valuation += discountedTerminalValue;
  
  const result = Math.max(valuation, 0);
  console.log(`DCF Growth Result: ${result} (Revenue: ${lastYearRevenue}, Growth: ${growthRate}%, Margin: ${profitMargin.toFixed(1)}%)`);
  return result;
}

function calculateDCFMultipleMethod(valuationData: ValuationData, companyData: CompanyData): number {
  console.log("Calculating DCF Multiple using DB data...");
  const lastYearRevenue = companyData.last_revenue || 0;
  // Use last_year_ebitda directly
  const ebitda = valuationData.last_year_ebitda || 0;
  // Use industry_multiple directly
  const industryMultiple = valuationData.industry_multiple || 8; // Default 8 if null
  
  let result = 0;
  // Apply multiple to EBITDA if positive, otherwise use revenue multiple as fallback
  if (ebitda > 0) {
    result = ebitda * industryMultiple;
    console.log(`DCF Multiple Result: ${result} (EBITDA: ${ebitda}, Multiple: ${industryMultiple})`);
  } else if (lastYearRevenue > 0) {
    // Fallback to revenue multiple (e.g., 0.8 * industry multiple)
    const revenueMultipleFallback = industryMultiple * 0.8;
    result = lastYearRevenue * revenueMultipleFallback;
     console.log(`DCF Multiple Result: ${result} (Fallback using Revenue: ${lastYearRevenue}, Multiple: ${revenueMultipleFallback.toFixed(2)})`);
  } else {
     console.log(`DCF Multiple Result: 0 (No positive EBITDA or Revenue)`);
  }
  
  return Math.max(result, 0);
}


// REMOVED: Helper function getRatingForCategory (used questionnaire data)
// REMOVED: Helper function mapDropdownToScore (used questionnaire data)
// REMOVED: Helper function scoreRevenue (used questionnaire data)
// REMOVED: Helper function scorePercentage (used questionnaire data)

// Calculate appropriate revenue multiple based on growth rate (Helper remains the same)
function calculateRevenueMultiple(growthRate: number): number {
  // Higher growth rates command higher multiples
  if (growthRate >= 100) return 15;
  if (growthRate >= 50) return 10;
  if (growthRate >= 30) return 8;
  if (growthRate >= 20) return 6;
  if (growthRate >= 10) return 4;
  return 2;
}

// Add a new function to generate default valuation results (Remains the same)
function getDefaultValuationResults(stage: string): ValuationResults {
  const weights = getDefaultWeights(stage);
  
  // Default values based on stage
  let baseValue = 2000000; // Default for seed
  
  if (stage === 'pre-seed' || stage === 'angel') {
    baseValue = 1000000;
  } else if (stage === 'growth' || stage === 'series a') {
    baseValue = 5000000;
  }
  
  // Apply slight variations to make the methods look distinct
  return {
    scorecard: baseValue * 1.2,
    checklistMethod: baseValue * 1.5,
    ventureCap: baseValue * 0.8,
    dcfGrowth: baseValue * 0.7,
    dcfMultiple: baseValue * 0.6,
    combinedValuation: baseValue,
    methodologyWeights: weights
  };
}

// Helper function to normalize extreme value differences (Remains the same)
function normalizeValuationMethodValues(values: Record<string, number>): Record<string, number> {
  const result = { ...values };
  const methodEntries = Object.entries(values);
  
  // Filter out zero or negative values
  const positiveValues = methodEntries
    .filter(([_, value]) => value > 0)
    .map(([_, value]) => value);
  
  if (positiveValues.length === 0) {
    return result; // Return original if no positive values
  }
  
  // Calculate geometric mean for more balanced result with extreme differences
  const logSum = positiveValues.reduce((sum, val) => sum + Math.log(val), 0);
  const geometricMean = Math.exp(logSum / positiveValues.length);
  
  // Check if values have extreme differences (orders of magnitude)
  const maxValue = Math.max(...positiveValues);
  const minValue = Math.min(...positiveValues);
  
  // If extreme differences exist, normalize
  if (maxValue / minValue > 100) {
    console.log("Extreme value differences detected, normalizing methods");
    
    // Find median as a reference point
    const sortedValues = [...positiveValues].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(sortedValues.length / 2)];
    
    // If any value is < 1% of the median or > 100x the median, adjust it
    for (const key of Object.keys(result)) {
      const value = result[key];
      
      if (value === 0) continue; // Skip zero values
      
      if (value < median * 0.01) {
        // Bring extremely small values closer to median
        result[key] = median * 0.01;
      } else if (value > median * 100) {
        // Bring extremely large values closer to median
        result[key] = median * 100;
      }
    }
  }
  
  return result;
} 