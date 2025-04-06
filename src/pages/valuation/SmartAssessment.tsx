import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, AlertCircle, CheckCircle2, Brain } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

// API Key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface QuestionnaireQuestion {
  id: string;
  questionnaire_id: string;
  question_number: string;
  question: string;
  response: string | null;
  response_type: string;
}

interface AssessmentResult {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  analysis: string;
  recommendations: string[];
  metrics: {
    teamQuality: { score: number, feedback: string };
    productReadiness: { score: number, feedback: string };
    marketOpportunity: { score: number, feedback: string };
    businessModel: { score: number, feedback: string };
    financialHealth: { score: number, feedback: string };
    growthPotential: { score: number, feedback: string };
    investmentReadiness: { score: number, feedback: string };
  };
}

export function SmartAssessment() {
  const { toast } = useToast();
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch questionnaire data when component mounts
  useEffect(() => {
    fetchQuestionnaireData();
  }, []);

  // Function to fetch questionnaire data from all steps
  const fetchQuestionnaireData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .order('question_number', { ascending: true });

      if (error) throw error;

      setQuestionnaireData(data);
      console.log("Fetched questionnaire data:", data);
    } catch (err: any) {
      console.error("Error fetching questionnaire data:", err);
      setError(err.message);
      toast({
        title: "Error fetching data",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to analyze questionnaire data with OpenAI
  const analyzeWithAI = async () => {
    if (!questionnaireData || questionnaireData.length === 0) {
      toast({
        title: "No data available",
        description: "Please complete the questionnaire first.",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Format the questionnaire data for the AI prompt
      const formattedQuestions = questionnaireData.map(q => ({
        number: q.question_number,
        question: q.question,
        response: q.response || "No response provided"
      }));

      // Extract specific question responses
      const extractResponse = (questionNumber: string) => {
        const question = questionnaireData.find(q => q.question_number === questionNumber);
        return question?.response || null;
      };

      // Company basics
      const companyName = extractResponse("1.1");
      const companyIndustry = extractResponse("1.2");
      const foundingYear = extractResponse("1.3");
      const founderCount = extractResponse("1.4");
      const teamSize = extractResponse("1.6"); 
      
      // Product details
      const productStage = extractResponse("2.1");
      const uniqueSellingPoints = extractResponse("2.6");
      const productMarketFit = extractResponse("2.7");
      const scalability = extractResponse("2.9");
      
      // Market details
      const marketSize = extractResponse("3.1");
      const marketGrowth = extractResponse("3.2");
      const competitiveAdvantage = extractResponse("3.7");
      const barriers = extractResponse("3.8");
      
      // Business model
      const revenueStreams = extractResponse("4.1");
      const acquisitionStrategy = extractResponse("4.2");
      const salesCycle = extractResponse("4.3");
      
      // Financials
      const revenue = extractResponse("6.1");
      const costs = extractResponse("6.2");
      const growthRate = extractResponse("6.3");
      const burnRate = extractResponse("6.4");
      const runway = extractResponse("6.5");
      const profitMargin = extractResponse("6.6");
      const fundingRaised = extractResponse("6.7");
      const breakEven = extractResponse("6.8");
      
      // Valuation
      const expectedValuation = extractResponse("7.8");

      // Create prompt for OpenAI
      const prompt = `
        You are an expert startup analyst evaluating a company based on their questionnaire responses.
        
        Company Information:
        - Name: ${companyName || "Not provided"}
        - Industry: ${companyIndustry || "Not provided"}
        - Founded: ${foundingYear || "Not provided"}
        - Number of Founders: ${founderCount || "Not provided"}
        - Team Size: ${teamSize || "Not provided"}
        
        Product Information:
        - Product Stage: ${productStage || "Not provided"}
        - Unique Selling Points: ${uniqueSellingPoints || "Not provided"}
        - Product-Market Fit: ${productMarketFit || "Not provided"}
        - Scalability: ${scalability || "Not provided"}
        
        Market Information:
        - Market Size: ${marketSize || "Not provided"}
        - Market Growth: ${marketGrowth || "Not provided"}
        - Competitive Advantage: ${competitiveAdvantage || "Not provided"}
        - Barriers to Entry: ${barriers || "Not provided"}
        
        Business Model:
        - Revenue Streams: ${revenueStreams || "Not provided"}
        - Customer Acquisition Strategy: ${acquisitionStrategy || "Not provided"}
        - Sales Cycle: ${salesCycle || "Not provided"}
        
        Financials:
        - Revenue: ${revenue || "Not provided"}
        - Costs: ${costs || "Not provided"}
        - Growth Rate: ${growthRate || "Not provided"}
        - Burn Rate: ${burnRate || "Not provided"}
        - Runway: ${runway || "Not provided"}
        - Profit Margin: ${profitMargin || "Not provided"}
        - Funding Raised: ${fundingRaised || "Not provided"}
        - Break Even: ${breakEven || "Not provided"}
        - Expected Valuation: ${expectedValuation || "Not provided"}
        
        Please provide a comprehensive assessment of this startup with:
        1. An overall score from 1-10
        2. 3-5 key strengths
        3. 3-5 key weaknesses or areas for improvement
        4. Brief analysis (max 200 words) 
        5. 3-5 strategic recommendations
        6. Specific scores (1-10) for the following categories:
           - Team Quality 
           - Product Readiness
           - Market Opportunity
           - Business Model
           - Financial Health
           - Growth Potential
           - Investment Readiness
        
        Format your response as valid JSON with the following structure:
        {
          "overallScore": number,
          "strengths": [string, string, ...],
          "weaknesses": [string, string, ...],
          "analysis": string,
          "recommendations": [string, string, ...],
          "metrics": {
            "teamQuality": { "score": number, "feedback": string },
            "productReadiness": { "score": number, "feedback": string },
            "marketOpportunity": { "score": number, "feedback": string },
            "businessModel": { "score": number, "feedback": string },
            "financialHealth": { "score": number, "feedback": string },
            "growthPotential": { "score": number, "feedback": string },
            "investmentReadiness": { "score": number, "feedback": string }
          }
        }
        `;

      // Call OpenAI API
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a startup valuation expert and analyst. Respond with JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        }),
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.text();
        console.error("OpenAI API error:", errorData);
        throw new Error("AI analysis failed: " + errorData);
      }
      
      const openAIData = await openAIResponse.json();
      
      if (openAIData.error) {
        console.error("OpenAI API error:", openAIData.error);
        throw new Error("AI analysis failed: " + openAIData.error.message);
      }
      
      // Get the raw content from OpenAI response
      let responseContent = openAIData.choices[0].message.content;
      
      // Extract JSON from the content if wrapped in markdown code blocks
      if (responseContent.includes('```json')) {
        responseContent = responseContent.replace(/```json\n|\n```/g, '');
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.replace(/```\n|\n```/g, '');
      }
      
      // Parse the JSON response
      const analysisResult = JSON.parse(responseContent);
      setResult(analysisResult);
      
      toast({
        title: "Analysis complete",
        description: "The startup assessment has been generated successfully.",
      });

      // Save the result to the database for future reference
      // This is optional - you may want to add this feature later
      /* 
      await supabase
        .from('ai_assessments')
        .insert({
          assessment: analysisResult,
          created_at: new Date()
        });
      */
      
    } catch (err: any) {
      console.error("Error analyzing with AI:", err);
      setError(err.message);
      toast({
        title: "Analysis failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-emerald-500";
    if (score >= 4) return "text-amber-500";
    return "text-red-500";
  };
  
  // Get appropriate emoji based on score
  const getScoreEmoji = (score: number) => {
    if (score >= 8) return "🌟";
    if (score >= 6) return "👍";
    if (score >= 4) return "⚠️";
    return "❌";
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin mr-2"><RefreshCw size={24} /></div>
        <p>Loading questionnaire data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Smart Assessment</h1>
        <div className="flex gap-4">
          <Button 
            onClick={fetchQuestionnaireData} 
            variant="outline"
            disabled={loading}
          >
            Refresh Data
          </Button>
          <Button 
            onClick={analyzeWithAI} 
            disabled={analyzing || !questionnaireData || questionnaireData.length === 0}
            isLoading={analyzing}
          >
            {analyzing ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </div>
      </div>
      
      {error && (
        <Card className="bg-red-50 p-4">
          <div className="flex items-start">
            <AlertCircle className="text-red-500 mt-1 mr-2" size={20} />
            <div>
              <h3 className="font-semibold">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}
      
      {!result && !analyzing && !error && (
        <Card className="p-6">
          <div className="flex items-center">
            <Brain className="text-primary mr-3" size={32} />
            <div>
              <h2 className="text-xl font-bold mb-1">AI Startup Assessment</h2>
              <p className="text-muted-foreground">
                Our AI will analyze your questionnaire responses to provide a comprehensive evaluation of your startup's strengths, 
                weaknesses, and potential. Click "Analyze with AI" to generate your assessment.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {analyzing && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Analyzing your startup...</h2>
          <div className="space-y-4">
            <Progress value={50} className="h-2" />
            <p className="text-muted-foreground text-sm italic">
              Our AI is reviewing your questionnaire data and generating insights. This may take a moment.
            </p>
          </div>
        </Card>
      )}
      
      {result && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Overall Assessment</h2>
              <div className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}>
                {result.overallScore}/10
              </div>
            </div>
            <p className="text-muted-foreground mb-4">{result.analysis}</p>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strength */}
              <div>
                <h3 className="font-semibold mb-2 text-emerald-600 flex items-center">
                  <CheckCircle2 size={16} className="mr-1" /> Strengths
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Weaknesses */}
              <div>
                <h3 className="font-semibold mb-2 text-amber-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" /> Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {result.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Recommendations */}
              <div>
                <h3 className="font-semibold mb-2 text-blue-600 flex items-center">
                  <Brain size={16} className="mr-1" /> Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
          
          {/* Detailed Metrics */}
          <Card>
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold">Detailed Metrics</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.metrics).map(([key, metric]) => {
                  const readableKey = key.replace(/([A-Z])/g, ' $1').trim();
                  const capitalizedKey = readableKey.charAt(0).toUpperCase() + readableKey.slice(1);
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{capitalizedKey}</h3>
                        <div className={`font-bold ${getScoreColor(metric.score)}`}>
                          {getScoreEmoji(metric.score)} {metric.score}/10
                        </div>
                      </div>
                      <Progress value={metric.score * 10} className="h-2" />
                      <p className="text-sm text-muted-foreground">{metric.feedback}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 