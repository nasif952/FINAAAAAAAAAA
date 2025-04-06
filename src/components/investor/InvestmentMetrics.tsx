
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Investment {
  id: string;
  capital_invested: number;
  number_of_shares: number;
  shareholders?: { id: string; name: string };
}

interface InvestorShare {
  name: string;
  value: number;
  id: string;
}

interface InvestmentMetricsProps {
  investments: Investment[];
}

// Color palette for the chart
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

export function InvestmentMetrics({ investments }: InvestmentMetricsProps) {
  const [chartData, setChartData] = useState<InvestorShare[]>([]);
  
  useEffect(() => {
    // Process investments data to group by investor
    const investorShares = investments.reduce((acc, investment) => {
      const investorId = investment.shareholders?.id || 'unknown';
      const investorName = investment.shareholders?.name || 'Unknown Investor';
      
      const existingInvestor = acc.find(investor => investor.id === investorId);
      
      if (existingInvestor) {
        existingInvestor.value += investment.number_of_shares;
      } else {
        acc.push({
          id: investorId,
          name: investorName,
          value: investment.number_of_shares
        });
      }
      
      return acc;
    }, [] as InvestorShare[]);
    
    setChartData(investorShares);
  }, [investments]);
  
  if (investments.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-muted-foreground">No investment data available</p>
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-muted-foreground">Processing data...</p>
      </div>
    );
  }
  
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value.toLocaleString()} shares`, 'Shares']}
            labelFormatter={(name) => `Investor: ${name}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
