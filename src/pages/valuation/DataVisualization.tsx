import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, RadarChart, Radar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Cell, Sector, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ScatterChart, Scatter
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, BarChart4, PieChart as PieChartIcon, LineChart as LineChartIcon, Radar as RadarIcon } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

interface QuestionnaireQuestion {
  id: string;
  questionnaire_id: string;
  question_number: string;
  question: string;
  response: string | null;
  response_type: string;
}

export function DataVisualization() {
  const { toast } = useToast();
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('financial');

  // Fetch questionnaire data when component mounts
  useEffect(() => {
    fetchQuestionnaireData();
  }, []);

  // Function to fetch questionnaire data from all steps
  const fetchQuestionnaireData = async () => {
    setLoading(true);
    try {
      // Use direct SQL query to get questionnaire data
      const { data, error } = await supabase
        .from('questionnaire_questions')
        .select('id, questionnaire_id, question_number, question, response, response_type');
      
      if (error) throw error;
      
      console.log("Fetched questionnaire data:", data);
      setQuestionnaireData(data);
      
      // Log specific questions for debugging
      const marketSizeQ = data?.find(q => q.question_number === "3.1");
      const marketGrowthQ = data?.find(q => q.question_number === "3.2");
      const revenueQ = data?.find(q => q.question_number === "6.1");
      
      console.log("Market Size question:", marketSizeQ);
      console.log("Market Growth question:", marketGrowthQ);
      console.log("Revenue question:", revenueQ);
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

  // Helper function to extract response value as number
  const getNumericResponse = (questionNumber: string): number | null => {
    const question = questionnaireData?.find(q => q.question_number === questionNumber);
    if (!question || !question.response) {
      console.log(`Question ${questionNumber} not found or has no response`);
      return null;
    }
    
    // Log the found response
    console.log(`Found response for ${questionNumber}:`, question.response);
    
    const numValue = parseFloat(question.response);
    if (isNaN(numValue)) {
      console.log(`Response for ${questionNumber} is not a valid number:`, question.response);
      return null;
    }
    
    return numValue;
  };

  // Helper function to extract response value as string
  const getStringResponse = (questionNumber: string): string | null => {
    const question = questionnaireData?.find(q => q.question_number === questionNumber);
    return question?.response || null;
  };

  // Financial Metrics Chart Data
  const getFinancialData = () => {
    // Extract financial data - only use direct questionnaire inputs
    const revenue = getNumericResponse("6.1");
    const costs = getNumericResponse("6.2");
    const growthRate = getNumericResponse("6.3");
    const burnRate = getNumericResponse("6.4");
    const runway = getNumericResponse("6.5");
    const profitMargin = getNumericResponse("6.6");
    const fundingRaised = getNumericResponse("6.7");
    const expectedValuation = getNumericResponse("7.8");
    
    // Only calculate profit if we have both revenue and profit margin from questionnaire
    const profit = revenue !== null && profitMargin !== null ? 
      revenue * (profitMargin / 100) : null;
      
    
    // Only create revenue projection if we have both base revenue and growth rate
    const revenueProjection = revenue !== null && growthRate !== null ? 
      Array.from({ length: 5 }, (_, i) => {
        const projectedRevenue = revenue * Math.pow(1 + (growthRate / 100), i);
        return {
          year: `Year ${i + 1}`,
          revenue: Math.round(projectedRevenue),
          profit: profit !== null ? Math.round(projectedRevenue * (profitMargin! / 100)) : 0
        };
      }) : [];
    
    // Income breakdown - only include values that exist in questionnaire
    const incomeBreakdown = [
      ...(revenue !== null ? [{ name: 'Revenue', value: revenue }] : []),
      ...(costs !== null ? [{ name: 'Costs', value: costs }] : []),
      ...(profit !== null ? [{ name: 'Profit', value: profit }] : [])
    ];
    
    // Financial metrics for radar chart - only include metrics with data
    const financialMetrics = [
      ...(revenue !== null ? [{ subject: 'Revenue', A: revenue / 1000000, fullMark: 10 }] : []),
      ...(growthRate !== null ? [{ subject: 'Growth Rate', A: growthRate / 10, fullMark: 10 }] : []),
      ...(profitMargin !== null ? [{ subject: 'Profit Margin', A: profitMargin / 10, fullMark: 10 }] : []),
      ...(runway !== null ? [{ subject: 'Runway (months)', A: runway / 12, fullMark: 10 }] : []),
      ...(fundingRaised !== null ? [{ subject: 'Funding Raised', A: fundingRaised / 1000000, fullMark: 10 }] : [])
    ];
    
    // Current metrics - only include metrics with actual questionnaire data
    const currentMetrics = [
      ...(revenue !== null ? [{ name: 'Revenue', value: revenue }] : []),
      ...(costs !== null ? [{ name: 'Costs', value: costs }] : []),
      ...(profit !== null ? [{ name: 'Profit', value: profit }] : []),
      ...(burnRate !== null ? [{ name: 'Burn Rate', value: burnRate }] : []),
      ...(fundingRaised !== null ? [{ name: 'Funding Raised', value: fundingRaised }] : []),
      ...(expectedValuation !== null ? [{ name: 'Expected Valuation', value: expectedValuation }] : [])
    ];
    
    return {
      revenueProjection,
      incomeBreakdown,
      financialMetrics,
      currentMetrics,
      hasRevenue: revenue !== null,
      hasFinancialData: currentMetrics.length > 0
    };
  };
  
  // Market Analysis Chart Data
  const getMarketData = () => {
    // Extract market data - handle strings for 3.1 and 3.2
    const marketSizeString = getStringResponse("3.1");
    const marketGrowthString = getStringResponse("3.2");
    const revenue = getNumericResponse("6.1");
    const growthRate = getNumericResponse("6.3");
    
    // Since 3.1 and 3.2 are strings, we can't calculate market share or projections
    // Instead, we'll just display the text values
    
    // Market text values to display
    const marketTextData = [
      ...(marketSizeString ? [{ name: 'Market Size', value: marketSizeString }] : []),
      ...(marketGrowthString ? [{ name: 'Market Growth', value: marketGrowthString }] : []),
      ...(revenue !== null ? [{ name: 'Revenue ($)', value: formatCurrency(revenue) }] : []),
      ...(growthRate !== null ? [{ name: 'Growth Rate (%)', value: formatPercentage(growthRate) }] : [])
    ];
    
    // Only include competitive positioning as sample data if there's any market data
    const competitivePositioning = marketSizeString || marketGrowthString || revenue !== null ? [
      { x: 80, y: 70, z: 100, name: 'Our Company' },
      { x: 60, y: 90, z: 80, name: 'Competitor A' },
      { x: 90, y: 40, z: 60, name: 'Competitor B' },
      { x: 30, y: 80, z: 50, name: 'Competitor C' },
      { x: 70, y: 30, z: 70, name: 'Competitor D' }
    ] : [];
    
    return {
      marketTextData,
      competitivePositioning,
      hasMarketData: marketSizeString || marketGrowthString || revenue !== null,
      hasNumericMarketData: false // We can't create charts with the string data
    };
  };
  
  // Team & Product Data
  const getTeamProductData = () => {
    // Extract team data - only use direct questionnaire inputs
    const foundersCount = getNumericResponse("1.4");
    const teamSize = getNumericResponse("1.6");
    const productStage = getStringResponse("2.1");
    const productMarketFit = getNumericResponse("2.7");
    const scalability = getNumericResponse("2.9");
    const techReadiness = getNumericResponse("2.3");
    const customerValidation = getNumericResponse("2.8");
    
    // Team composition - only create if we have required data
    const teamComposition = (foundersCount !== null && teamSize !== null && foundersCount <= teamSize) ? [
      { name: 'Founders', value: foundersCount },
      { name: 'Team Members', value: teamSize - foundersCount }
    ] : [];
    
    // Product readiness metrics - only include metrics with actual data
    const productReadiness = [
      ...(productMarketFit !== null ? [{ name: 'Product-Market Fit', value: productMarketFit }] : []),
      ...(scalability !== null ? [{ name: 'Scalability', value: scalability }] : []),
      ...(techReadiness !== null ? [{ name: 'Technology Readiness', value: techReadiness }] : []),
      ...(customerValidation !== null ? [{ name: 'Customer Validation', value: customerValidation }] : [])
    ];
    
    return {
      teamComposition,
      productReadiness,
      productStage,
      hasTeamData: teamComposition.length > 0,
      hasProductData: productReadiness.length > 0
    };
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

  const financialData = getFinancialData();
  const marketData = getMarketData();
  const teamProductData = getTeamProductData();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Visualization</h1>
        <div className="flex gap-4">
          <Button 
            onClick={fetchQuestionnaireData} 
            variant="outline"
            disabled={loading}
          >
            Refresh Data
          </Button>
        </div>
      </div>
      
      {error && (
        <Card className="bg-red-50 p-4">
          <div className="flex items-start">
            <RefreshCw className="text-red-500 mt-1 mr-2" size={20} />
            <div>
              <h3 className="font-semibold">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}
      
      {!questionnaireData?.length && !loading && !error && (
        <Card className="p-6">
          <div className="flex items-center">
            <BarChart4 className="text-primary mr-3" size={32} />
            <div>
              <h2 className="text-xl font-bold mb-1">No Questionnaire Data Available</h2>
              <p className="text-muted-foreground">
                Please complete the questionnaire to generate visualizations of your startup data.
              </p>
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm">You can manually check questionnaire data with this SQL query:</p>
                <pre className="mt-2 p-2 bg-gray-700 text-white rounded-md text-xs overflow-x-auto">
                  SELECT question_number, question, response FROM public.questionnaire_questions;
                </pre>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {questionnaireData?.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mb-6 bg-background border-b border-border rounded-none p-0">
            <TabsTrigger 
              value="financial" 
              className={`px-6 py-3 rounded-none ${activeTab === 'financial' ? 'border-b-2 border-primary' : ''}`}
            >
              <BarChart4 size={16} className="mr-2" /> Financial
            </TabsTrigger>
            <TabsTrigger 
              value="market" 
              className={`px-6 py-3 rounded-none ${activeTab === 'market' ? 'border-b-2 border-primary' : ''}`}
            >
              <PieChartIcon size={16} className="mr-2" /> Market
            </TabsTrigger>
            <TabsTrigger 
              value="team" 
              className={`px-6 py-3 rounded-none ${activeTab === 'team' ? 'border-b-2 border-primary' : ''}`}
            >
              <RadarIcon size={16} className="mr-2" /> Team & Product
            </TabsTrigger>
          </TabsList>
          
          {/* Financial Metrics Tab */}
          <TabsContent value="financial" className="space-y-6">
            {/* Show message if no financial data */}
            {!financialData.hasFinancialData && (
              <Card className="p-6">
                <div className="flex items-center">
                  <BarChart4 className="text-primary mr-3" size={32} />
                  <div>
                    <h2 className="text-xl font-bold mb-1">No Financial Data</h2>
                    <p className="text-muted-foreground">
                      To see financial visualizations, please provide data in the questionnaire for:
                      <ul className="list-disc ml-6 mt-2">
                        <li>Revenue (Question 6.1)</li>
                        <li>Costs (Question 6.2)</li>
                        <li>Growth Rate (Question 6.3)</li>
                        <li>Profit Margin (Question 6.6)</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Financial Overview Card */}
            {financialData.currentMetrics.length > 0 && (
              <Card>
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-bold">Financial Overview</h2>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {financialData.currentMetrics.map((metric, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <h3 className="text-sm text-muted-foreground">{metric.name}</h3>
                      <p className="text-xl font-bold mt-1">{formatCurrency(metric.value)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* Revenue Projection Chart */}
            {financialData.revenueProjection.length > 0 && (
              <Card>
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-bold">Revenue & Profit Projection</h2>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financialData.revenueProjection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => {
                        if (typeof value === 'number') {
                          return `$${value.toLocaleString()}`;
                        }
                        return `$${value}`;
                      }} />
                      <Tooltip formatter={(value) => {
                        if (typeof value === 'number') {
                          return [`$${value.toLocaleString()}`, undefined];
                        }
                        return [`$${value}`, undefined];
                      }} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#0088FE" />
                      <Bar dataKey="profit" name="Profit" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
            
            {/* Income Breakdown and Financial Health */}
            {(financialData.incomeBreakdown.length > 0 || financialData.financialMetrics.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income Breakdown */}
                {financialData.incomeBreakdown.length > 0 && (
                  <Card>
                    <div className="p-4 border-b border-border">
                      <h2 className="text-xl font-bold">Income Breakdown</h2>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={financialData.incomeBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {financialData.incomeBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => {
                            if (typeof value === 'number') {
                              return [`$${value.toLocaleString()}`, undefined];
                            }
                            return [`$${value}`, undefined];
                          }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
                
                {/* Financial Health Radar */}
                {financialData.financialMetrics.length > 0 && (
                  <Card>
                    <div className="p-4 border-b border-border">
                      <h2 className="text-xl font-bold">Financial Health</h2>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius={80} data={financialData.financialMetrics}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} />
                          <Radar name="Financial Metrics" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Market Analysis Tab */}
          <TabsContent value="market" className="space-y-6">
            {/* Show message if no market data */}
            {!marketData.hasMarketData && (
              <Card className="p-6">
                <div className="flex items-center">
                  <PieChartIcon className="text-primary mr-3" size={32} />
                  <div>
                    <h2 className="text-xl font-bold mb-1">No Market Data</h2>
                    <p className="text-muted-foreground">
                      To see market visualizations, please provide data in the questionnaire for:
                      <ul className="list-disc ml-6 mt-2">
                        <li>Market Size (Question 3.1)</li>
                        <li>Market Growth (Question 3.2)</li>
                        <li>Revenue (Question 6.1)</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Market Text Values */}
            {marketData.marketTextData.length > 0 && (
              <Card>
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-bold">Market Text Values</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {marketData.marketTextData.map((data, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-sm text-muted-foreground">{data.name}:</span>
                        <span className="text-xl font-bold ml-2">{data.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
            
            {/* Competitive Positioning */}
            {marketData.competitivePositioning.length > 0 && (
              <Card>
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-bold">Competitive Positioning</h2>
                  <p className="text-sm text-muted-foreground">X: Product Quality, Y: Price Competitiveness, Size: Market Share</p>
                  <p className="text-xs text-muted-foreground italic mt-1">Note: This chart uses sample competitive data for visualization purposes</p>
                </div>
                <div className="p-4 relative">
                  {/* Blur overlay */}
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <div className="bg-primary px-4 py-2 rounded-full text-white font-bold mb-2">Coming Soon</div>
                    <p className="text-center text-sm max-w-xs">Enhanced competitive analysis will be available in the next update</p>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="x" name="Product Quality" unit="%" />
                      <YAxis type="number" dataKey="y" name="Price Competitiveness" unit="%" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => {
                        if (typeof value === 'number') {
                          return [`${value}%`, undefined];
                        }
                        return [`${value}%`, undefined];
                      }} />
                      <Legend />
                      <Scatter name="Companies" data={marketData.competitivePositioning} fill="#8884d8">
                        {marketData.competitivePositioning.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </TabsContent>
          
          {/* Team & Product Tab */}
          <TabsContent value="team" className="space-y-6">
            {/* Show message if no team/product data */}
            {!teamProductData.hasTeamData && !teamProductData.hasProductData && (
              <Card className="p-6">
                <div className="flex items-center">
                  <RadarIcon className="text-primary mr-3" size={32} />
                  <div>
                    <h2 className="text-xl font-bold mb-1">No Team/Product Data</h2>
                    <p className="text-muted-foreground">
                      To see team and product visualizations, please provide data in the questionnaire for:
                      <ul className="list-disc ml-6 mt-2">
                        <li>Founders Count (Question 1.4)</li>
                        <li>Team Size (Question 1.6)</li>
                        <li>Product Stage (Question 2.1)</li>
                        <li>Product-Market Fit (Question 2.7)</li>
                        <li>Scalability (Question 2.9)</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Team Composition */}
            {teamProductData.hasTeamData && (
              <Card>
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-bold">Team Composition</h2>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={teamProductData.teamComposition}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {teamProductData.teamComposition.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-lg font-semibold mb-4">Product Stage</h3>
                    <div className="p-4 border rounded-md bg-gray-50">
                      <p className="text-2xl font-bold text-center">{teamProductData.productStage || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Product Readiness */}
            {teamProductData.productReadiness.length > 0 && (
              <Card>
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-bold">Product Readiness</h2>
                </div>
                <div className="p-4">
                  {/* Replace radar chart with horizontal bar chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      layout="vertical"
                      data={teamProductData.productReadiness}
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip 
                        formatter={(value) => {
                          if (typeof value === 'number') {
                            return [`${value}%`, undefined];
                          }
                          return [value, undefined];
                        }}
                        cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Score" fill="#82ca9d" radius={[0, 4, 4, 0]}>
                        {teamProductData.productReadiness.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.value > 70 ? '#4CAF50' : entry.value > 40 ? '#FFC107' : '#F44336'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Add descriptive text below the chart */}
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>This chart shows product readiness metrics from your questionnaire responses.</p>
                    <p className="mt-2">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1"></span> 70-100%: Strong
                      <span className="inline-block w-3 h-3 bg-yellow-500 rounded-sm mx-3 mr-1"></span> 40-70%: Moderate
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-sm mx-3 mr-1"></span> 0-40%: Needs improvement
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Footer note */}
      <div className="mt-8 pt-6 border-t flex flex-col items-center justify-center text-center">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Data visualization powered by</p>
          <a 
            href="https://www.diamondai.tech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <span className="font-bold text-primary">Diamond</span>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">AI</span>
          </a>
        </div>
      </div>
    </div>
  );
} 