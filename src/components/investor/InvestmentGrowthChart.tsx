import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface RoundSummary {
  id: string;
  round_id: string;
  total_capital: number;
  total_shares: number;
  created_at?: string;
  updated_at?: string;
}

interface FundingRound {
  id: string;
  name: string;
  date: string;
  valuation: number;
  is_foundation: boolean;
  round_summaries?: RoundSummary[];
}

interface ChartData {
  name: string;
  value: number;
  date: string;
}

interface InvestmentGrowthChartProps {
  fundingRounds: FundingRound[];
}

export function InvestmentGrowthChart({ fundingRounds }: InvestmentGrowthChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  useEffect(() => {
    if (!fundingRounds.length) return;
    
    // Sort rounds by date
    const sortedRounds = [...fundingRounds].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate cumulative investment
    let cumulativeInvestment = 0;
    const data = sortedRounds.map(round => {
      const roundInvestment = round.round_summaries?.[0]?.total_capital || 0;
      cumulativeInvestment += roundInvestment;
      
      return {
        name: round.name,
        value: cumulativeInvestment,
        date: new Date(round.date).toLocaleDateString()
      };
    });
    
    setChartData(data);
  }, [fundingRounds]);
  
  if (!fundingRounds.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No funding rounds data available</p>
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Processing data...</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value, 0)}
        />
        <Tooltip 
          formatter={(value: number) => [formatCurrency(value), 'Total Investment']}
          labelFormatter={(name) => `Round: ${name}`}
        />
        <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>
    </ResponsiveContainer>
  );
} 