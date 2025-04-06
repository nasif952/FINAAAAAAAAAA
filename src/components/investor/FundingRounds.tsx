
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';

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

interface FundingRoundsProps {
  rounds: FundingRound[];
  isLoading: boolean;
}

export function FundingRounds({ rounds, isLoading }: FundingRoundsProps) {
  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">Loading funding rounds data...</p>
      </div>
    );
  }
  
  if (rounds.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">No funding rounds found.</p>
      </div>
    );
  }
  
  // Sort rounds by date (most recent first)
  const sortedRounds = [...rounds].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Round</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Valuation</TableHead>
            <TableHead>Capital Raised</TableHead>
            <TableHead>Shares Issued</TableHead>
            <TableHead className="text-right">Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRounds.map((round) => {
            // Get the total capital and shares from the first round summary
            // If there's no round summary or it's empty, default to 0
            const totalCapital = round.round_summaries && round.round_summaries.length > 0
              ? round.round_summaries[0].total_capital 
              : 0;
            const totalShares = round.round_summaries && round.round_summaries.length > 0
              ? round.round_summaries[0].total_shares
              : 0;
              
            return (
              <TableRow key={round.id}>
                <TableCell className="font-medium">{round.name}</TableCell>
                <TableCell>
                  {new Date(round.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {formatCurrency(round.valuation)}
                </TableCell>
                <TableCell>
                  {formatCurrency(totalCapital)}
                </TableCell>
                <TableCell>
                  {totalShares.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {round.is_foundation ? (
                    <Badge variant="secondary">Foundation</Badge>
                  ) : (
                    <Badge>Funding</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
