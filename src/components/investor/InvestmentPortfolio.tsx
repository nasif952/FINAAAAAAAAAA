
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';

interface Shareholder {
  id: string;
  name: string;
}

interface ShareClass {
  id: string;
  name: string;
}

interface Investment {
  id: string;
  capital_invested: number;
  number_of_shares: number;
  share_price: number;
  shareholders?: Shareholder;
  share_classes?: ShareClass;
}

interface InvestmentPortfolioProps {
  investments: Investment[];
  isLoading: boolean;
}

export function InvestmentPortfolio({ investments, isLoading }: InvestmentPortfolioProps) {
  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">Loading investments data...</p>
      </div>
    );
  }
  
  if (investments.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">No investments found.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Investor</TableHead>
            <TableHead>Shares</TableHead>
            <TableHead>Share Class</TableHead>
            <TableHead>Share Price</TableHead>
            <TableHead className="text-right">Amount Invested</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.map((investment) => (
            <TableRow key={investment.id}>
              <TableCell className="font-medium">
                {investment.shareholders?.name || 'Unknown Investor'}
              </TableCell>
              <TableCell>
                {investment.number_of_shares.toLocaleString()}
              </TableCell>
              <TableCell>
                {investment.share_classes?.name || 'Standard'}
              </TableCell>
              <TableCell>
                {formatCurrency(investment.share_price)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(investment.capital_invested)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
