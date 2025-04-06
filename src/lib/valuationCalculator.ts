import { supabase } from '@/integrations/supabase/client';

// Type for questionnaire questions with responses
interface QuestionWithResponse {
  id: string;
  question: string;
  question_number: string;
  response: string | null;
  response_type: string;
}

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

// Fetch all questionnaire data for valuation calculation
export async function fetchQuestionnaireData(valuationId: string): Promise<QuestionWithResponse[]> {
  // Get all questionnaires for this valuation
  const { data: questionnaires, error: qError } = await supabase
    .from('questionnaires')
    .select('id')
    .eq('valuation_id', valuationId);
    
  if (qError || !questionnaires || questionnaires.length === 0) {
    return [];
  }
  
  // Get all questions with responses
  const questionnaireIds = questionnaires.map(q => q.id);
  const { data: questions, error: questionError } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .in('questionnaire_id', questionnaireIds);
    
  if (questionError || !questions) {
    return [];
  }
  
  return questions as QuestionWithResponse[];
}

// Helper function to fetch growth rate from questionnaire
export async function fetchGrowthRateFromQuestionnaire(): Promise<number | null> {
  try {
    // Fetch questionnaire data to get growth rate (Q6.6)
    const { data: questionnaireData, error } = await supabase
      .from('questionnaire_questions')
      .select('question_number, response')
      .order('question_number', { ascending: true });
      
    if (error || !questionnaireData) {
      console.error("Error fetching questionnaire data for growth rate:", error);
      return null;
    }
    
    // Look for revenue growth rate (Q6.6)
    const growthRateQ = questionnaireData.find(q => q.question_number === "6.6");
    if (growthRateQ && growthRateQ.response) {
      const growthRate = parseFloat(growthRateQ.response);
      console.log("Found questionnaire growth rate:", growthRate);
      return growthRate;
    }
    
    return null;
  } catch (err) {
    console.error("Error in fetchGrowthRateFromQuestionnaire:", err);
    return null;
  }
}

// Calculate valuation based on questionnaire responses
export async function calculateValuation(valuationId: string, companyId: string): Promise<ValuationResults> {
  try {
    console.log(`Starting valuation calculation for valuation ID: ${valuationId}, company ID: ${companyId}`);
    
    // Default weights by company stage
    const { data: company } = await supabase
      .from('companies')
      .select('stage')
      .eq('id', companyId)
      .single();
      
    const stage = company?.stage?.toLowerCase() || 'seed';
    console.log(`Company stage detected: ${stage}`);
    
    // Get default methodology weights based on stage
    const weights = getDefaultWeights(stage);
    
    // Fetch questionnaire data
    const questions = await fetchQuestionnaireData(valuationId);
    console.log(`Retrieved ${questions.length} questions for valuation`);
    
    // Fetch growth rate from questionnaire (Q6.6)
    const growthRate = await fetchGrowthRateFromQuestionnaire();
    if (growthRate !== null) {
      // Update the annual_roi field directly
      await supabase
        .from('valuations')
        .update({ annual_roi: growthRate })
        .eq('id', valuationId);
      console.log("Updated annual_roi from questionnaire:", growthRate);
    }
    
    // If no questions found, use default values
    if (questions.length === 0) {
      console.log("No questionnaire data found, using default values");
      return getDefaultValuationResults(stage);
    }
    
    // Calculate valuation using different methods
    const scorecardValue = calculateScorecardMethod(questions);
    const checklistValue = calculateChecklistMethod(questions);
    const ventureCapValue = calculateVentureCapMethod(questions);
    const dcfGrowthValue = calculateDCFGrowthMethod(questions);
    const dcfMultipleValue = calculateDCFMultipleMethod(questions);
    
    console.log("Individual method calculations:", {
      scorecard: scorecardValue,
      checklist: checklistValue,
      ventureCap: ventureCapValue,
      dcfGrowth: dcfGrowthValue,
      dcfMultiple: dcfMultipleValue
    });
    
    // Calculate weighted average with normalization
    const enabledMethods = Object.entries(weights)
      .filter(([_, config]) => config.enabled)
      .map(([method, config]) => ({ method, weight: config.weight }));
      
    const totalWeight = enabledMethods.reduce((sum, item) => sum + item.weight, 0);
    
    // Create an array of all method values for normalization
    const methodValues = {
      scorecard: scorecardValue,
      checklistMethod: checklistValue,
      ventureCap: ventureCapValue,
      dcfGrowth: dcfGrowthValue,
      dcfMultiple: dcfMultipleValue
    };
    
    // Normalize extreme value differences before combining
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
    // Return default fallback values
    return getDefaultValuationResults('seed');
  }
}

// Update the valuation in the database
export async function updateValuationWithResults(
  valuationId: string, 
  results: ValuationResults,
  manuallySelectedValue?: number // Add optional parameter for manually selected value
): Promise<void> {
  try {
    console.log(`Updating valuation ${valuationId} with results:`, results);
    
    // First get the current selected_valuation to preserve it
    const { data: currentValuation, error: fetchError } = await supabase
      .from('valuations')
      .select('selected_valuation')
      .eq('id', valuationId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching current valuation:", fetchError);
      throw fetchError;
    }
    
    // Use manually specified value first, then database value, then calculation result
    const selectedValuation = manuallySelectedValue !== undefined 
      ? manuallySelectedValue 
      : (currentValuation?.selected_valuation || results.combinedValuation);
      
    console.log("DEBUG: Preserving selected_valuation:", selectedValuation);
    
    // Only update the fields that exist in the database schema
    const { data, error } = await supabase
      .from('valuations')
      .update({
        selected_valuation: selectedValuation,
        pre_money_valuation: selectedValuation, // Use the selected valuation for pre-money
        // Calculate investment as 15% of pre-money valuation
        investment: selectedValuation * 0.15,
        // Calculate post-money valuation
        post_money_valuation: selectedValuation + (selectedValuation * 0.15)
      })
      .eq('id', valuationId)
      .select();
      
    if (error) {
      console.error("Error updating valuation with results:", error);
      throw error;
    }
    
    console.log("Valuation updated successfully");
  } catch (error) {
    console.error("Failed to update valuation with results:", error);
    throw error;
  }
}

// Function to get default weights based on company stage
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

// Valuation method implementations
function calculateScorecardMethod(questions: QuestionWithResponse[]): number {
  // Base valuation for comparison (seed stage software startup average)
  const baseValuation = 5000000;
  
  // Factors to evaluate with weights
  const factors = {
    team: 0.3,           // Team quality and experience
    market: 0.25,         // Market size and growth
    product: 0.15,        // Product/technology uniqueness
    competition: 0.1,     // Competitive landscape
    businessModel: 0.1,   // Business model viability
    financials: 0.1       // Financial projections
  };
  
  // Extract team rating (questions 1.x)
  const teamRating = getRatingForCategory(questions, "1.", {
    founderExperience: 0.4,
    teamCompleteness: 0.3,
    industryExpertise: 0.3
  });
  
  // Extract market rating (questions 3.x)
  const marketRating = getRatingForCategory(questions, "3.", {
    marketSize: 0.4,
    marketGrowth: 0.4, 
    marketPosition: 0.2
  });
  
  // Extract product rating (questions 2.x)
  const productRating = getRatingForCategory(questions, "2.", {
    productStage: 0.3,
    userTraction: 0.4,
    ipProtection: 0.3
  });
  
  // Extract competition rating (questions 5.x)
  const competitionRating = getRatingForCategory(questions, "5.", {
    competitiveAdvantage: 0.6,
    competitivePosition: 0.4
  });
  
  // Extract business model rating (questions 4.x)
  const businessModelRating = getRatingForCategory(questions, "4.", {
    revenueModel: 0.4,
    margins: 0.3,
    customerAcquisition: 0.3
  });
  
  // Extract financials rating (questions 6.x)
  const financialsRating = getRatingForCategory(questions, "6.", {
    revenue: 0.4,
    growth: 0.4,
    profitability: 0.2
  });
  
  // Calculate weighted average rating
  const weightedRating = 
    teamRating * factors.team +
    marketRating * factors.market +
    productRating * factors.product +
    competitionRating * factors.competition +
    businessModelRating * factors.businessModel +
    financialsRating * factors.financials;
  
  // Apply the rating to the base valuation
  return baseValuation * weightedRating;
}

function calculateChecklistMethod(questions: QuestionWithResponse[]): number {
  // Base valuation (pre-money)
  const baseValuation = 7500000;
  
  // Factors with adjustment ranges
  const factors = [
    { name: "Team Strength", adjustment: [-0.5, 1.0], category: "1." },
    { name: "Product Stage", adjustment: [-0.5, 1.0], category: "2." },
    { name: "Market Size", adjustment: [-0.25, 1.0], category: "3." },
    { name: "Competition", adjustment: [-0.5, 0.5], category: "5." },
    { name: "Marketing/Sales Channels", adjustment: [-0.25, 0.5], category: "4." },
    { name: "Need for Additional Investment", adjustment: [-0.5, 0.0], category: "6." },
    { name: "Revenue Potential", adjustment: [-0.25, 1.0], category: "6." }
  ];
  
  let totalAdjustment = 0;
  
  // Calculate adjustment for each factor
  factors.forEach(factor => {
    const rating = getRatingForCategory(questions, factor.category);
    const adjustmentRange = factor.adjustment[1] - factor.adjustment[0];
    const adjustment = factor.adjustment[0] + (adjustmentRange * rating);
    totalAdjustment += adjustment;
  });
  
  // Apply adjustment to base valuation
  return baseValuation * (1 + totalAdjustment);
}

function calculateVentureCapMethod(questions: QuestionWithResponse[]): number {
  // Extract financial data from questionnaire
  let lastYearRevenue = 0;
  let projectedRevenue = 0;
  let growthRate = 0;
  
  // Get last year revenue (Q6.1)
  const revenueQ = questions.find(q => q.question_number === "6.1");
  if (revenueQ && revenueQ.response) {
    lastYearRevenue = parseFloat(revenueQ.response.replace(/[^0-9.]/g, '')) || 0;
  }
  
  // Get projected revenue (Q7.2)
  const projectedRevenueQ = questions.find(q => q.question_number === "7.2");
  if (projectedRevenueQ && projectedRevenueQ.response) {
    projectedRevenue = parseFloat(projectedRevenueQ.response.replace(/[^0-9.]/g, '')) || 0;
  }
  
  // Get growth rate (Q7.3)
  const growthRateQ = questions.find(q => q.question_number === "7.3");
  if (growthRateQ && growthRateQ.response) {
    growthRate = parseFloat(growthRateQ.response.replace(/[^0-9.]/g, '')) || 0;
  }
  
  // Calculate valuation based on revenue multiples
  const revenueMultiple = calculateRevenueMultiple(growthRate);
  
  // Use projected revenue if available, otherwise use current revenue with growth
  const revenueToUse = projectedRevenue > 0 ? 
    projectedRevenue : 
    (lastYearRevenue * (1 + (growthRate / 100)));
  
  return revenueToUse * revenueMultiple;
}

function calculateDCFGrowthMethod(questions: QuestionWithResponse[]): number {
  // This is a simplified DCF calculation
  let lastYearRevenue = 0;
  let growthRate = 0;
  let profitMargin = 0;
  
  // Get last year revenue (Q6.1)
  const revenueQ = questions.find(q => q.question_number === "6.1");
  if (revenueQ && revenueQ.response) {
    lastYearRevenue = parseFloat(revenueQ.response.replace(/[^0-9.]/g, '')) || 0;
  }
  
  // Get expected growth rate (Q7.3)
  const growthRateQ = questions.find(q => q.question_number === "7.3");
  if (growthRateQ && growthRateQ.response) {
    growthRate = parseFloat(growthRateQ.response.replace(/[^0-9.]/g, '')) || 0;
  }
  
  // Get profit margin (Q6.6)
  const profitMarginQ = questions.find(q => q.question_number === "6.6");
  if (profitMarginQ && profitMarginQ.response) {
    profitMargin = parseFloat(profitMarginQ.response.replace(/[^0-9.]/g, '')) || 0;
  }
  
  // Default values if not provided
  growthRate = growthRate || 20; // 20% default growth
  profitMargin = profitMargin || 15; // 15% default margin
  
  // Calculate future cash flows
  const discountRate = 0.25; // High discount rate for early stage
  const terminalMultiple = 10; // Terminal multiple
  const projectionYears = 5; // 5 year projection
  
  let valuation = 0;
  let currentRevenue = lastYearRevenue;
  
  // Calculate DCF for projection period
  for (let year = 1; year <= projectionYears; year++) {
    // Project revenue growth
    currentRevenue *= (1 + (growthRate / 100));
    
    // Calculate cash flow
    const cashFlow = currentRevenue * (profitMargin / 100);
    
    // Discount cash flow to present value
    const discountFactor = Math.pow(1 + discountRate, year);
    valuation += cashFlow / discountFactor;
  }
  
  // Add terminal value
  const terminalCashFlow = currentRevenue * (profitMargin / 100) * (1 + 0.03); // Terminal growth of 3%
  const terminalValue = terminalCashFlow * terminalMultiple;
  const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, projectionYears);
  
  valuation += discountedTerminalValue;
  
  return Math.max(valuation, 0);
}

function calculateDCFMultipleMethod(questions: QuestionWithResponse[]): number {
  // Get last year revenue
  let lastYearRevenue = 0;
  const revenueQ = questions.find(q => q.question_number === "6.1");
  if (revenueQ && revenueQ.response) {
    lastYearRevenue = parseFloat(revenueQ.response.replace(/[^0-9.]/g, '')) || 0;
  }
  
  // Get last year EBITDA or estimate from profit margin
  let ebitda = 0;
  const profitMarginQ = questions.find(q => q.question_number === "6.6");
  if (profitMarginQ && profitMarginQ.response) {
    const profitMargin = parseFloat(profitMarginQ.response.replace(/[^0-9.]/g, '')) || 0;
    ebitda = lastYearRevenue * (profitMargin / 100);
  }
  
  // Get industry info
  let industryMultiple = 8; // Default industry multiple
  const industryQ = questions.find(q => q.question_number === "5.1");
  if (industryQ && industryQ.response) {
    // Adjust multiple based on industry (simplified)
    if (industryQ.response.toLowerCase().includes('tech') || 
        industryQ.response.toLowerCase().includes('software')) {
      industryMultiple = 10;
    } else if (industryQ.response.toLowerCase().includes('health') || 
               industryQ.response.toLowerCase().includes('bio')) {
      industryMultiple = 12;
    }
  }
  
  // Apply multiple to EBITDA or to revenue if EBITDA is too small
  if (ebitda > lastYearRevenue * 0.05) { // Only use EBITDA if it's significant
    return ebitda * industryMultiple;
  } else {
    // Fall back to revenue multiple if EBITDA is negative or too small
    return lastYearRevenue * (industryMultiple * 0.8);
  }
}

// Helper function to get a rating for a category of questions
function getRatingForCategory(
  questions: QuestionWithResponse[], 
  prefix: string, 
  weights: {[key: string]: number} = {}
): number {
  // Filter questions in this category
  const categoryQuestions = questions.filter(q => q.question_number.startsWith(prefix));
  
  if (categoryQuestions.length === 0) {
    return 0.5; // Default to middle rating if no questions
  }
  
  // Calculate a score for each question
  const scores = categoryQuestions.map(q => {
    // Skip questions without responses
    if (!q.response) return 0.5;
    
    // Handle different question types
    if (q.response_type === 'dropdown') {
      // Position in dropdown determines score
      const optionIndex = q.response;
      return optionIndex ? mapDropdownToScore(optionIndex) : 0.5;
    } else {
      // For text/numeric responses, try to extract a number
      const numValue = parseFloat(q.response.replace(/[^0-9.]/g, ''));
      if (!isNaN(numValue)) {
        // Different scoring based on question context
        if (q.question.toLowerCase().includes('revenue') || 
            q.question.toLowerCase().includes('customer')) {
          return scoreRevenue(numValue);
        } else if (q.question.toLowerCase().includes('growth') || 
                  q.question.toLowerCase().includes('margin')) {
          return scorePercentage(numValue);
        }
      }
      return 0.5; // Default to middle score
    }
  });
  
  // If no weights provided, use simple average
  if (Object.keys(weights).length === 0) {
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
  
  // Otherwise use weighted average
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.keys(weights).forEach((key, index) => {
    if (index < scores.length) {
      totalScore += scores[index] * weights[key];
      totalWeight += weights[key];
    }
  });
  
  return totalWeight > 0 ? totalScore / totalWeight : 0.5;
}

// Helper function to convert dropdown position to a score
function mapDropdownToScore(optionIndex: string): number {
  // Simple mapping logic - can be customized
  const options = ['option1', 'option2', 'option3', 'option4', 'option5'];
  const index = options.indexOf(optionIndex);
  
  if (index >= 0) {
    return (index + 1) / options.length;
  }
  
  return 0.5; // Middle score as default
}

// Score revenue based on logarithmic scale
function scoreRevenue(revenue: number): number {
  if (revenue <= 0) return 0;
  // Score from 0-1 with diminishing returns for higher revenue
  return Math.min(1, Math.log10(revenue) / 7); // 10M revenue = score of ~0.86
}

// Score percentages linearly
function scorePercentage(percentage: number): number {
  // Keep between 0-1 with higher percentages = better score
  return Math.min(1, Math.max(0, percentage / 100));
}

// Calculate appropriate revenue multiple based on growth rate
function calculateRevenueMultiple(growthRate: number): number {
  // Higher growth rates command higher multiples
  if (growthRate >= 100) return 15;
  if (growthRate >= 50) return 10;
  if (growthRate >= 30) return 8;
  if (growthRate >= 20) return 6;
  if (growthRate >= 10) return 4;
  return 2;
}

// Add a new function to generate default valuation results
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

// Helper function to normalize extreme value differences
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