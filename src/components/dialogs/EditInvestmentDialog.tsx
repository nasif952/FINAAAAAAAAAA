
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Investment {
  id: string;
  number_of_shares: number;
  share_price: number;
  capital_invested: number;
  shareholders?: { id: string; name: string };
  share_classes?: { id: string; name: string };
}

interface ShareClass {
  id: string;
  name: string;
}

interface EditInvestmentDialogProps {
  investment: Investment;
  shareClasses: ShareClass[];
  onInvestmentEdited?: () => void;
}

export function EditInvestmentDialog({ investment, shareClasses, onInvestmentEdited }: EditInvestmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [numberOfShares, setNumberOfShares] = useState(investment.number_of_shares.toString());
  const [sharePrice, setSharePrice] = useState(investment.share_price.toString());
  const [shareClassId, setShareClassId] = useState(investment.share_classes?.id || '');
  const [capitalInvested, setCapitalInvested] = useState(investment.capital_invested.toString());
  const { toast } = useToast();

  // Handle automatic calculation of capital invested based on shares and price
  const handleSharesChange = (value: string) => {
    setNumberOfShares(value);
    if (value && sharePrice) {
      const shares = parseFloat(value) || 0;
      const price = parseFloat(sharePrice) || 0;
      setCapitalInvested((shares * price).toFixed(2));
    }
  };

  const handlePriceChange = (value: string) => {
    setSharePrice(value);
    if (value && numberOfShares) {
      const shares = parseFloat(numberOfShares) || 0;
      const price = parseFloat(value) || 0;
      setCapitalInvested((shares * price).toFixed(2));
    }
  };

  const updateInvestmentMutation = useMutation({
    mutationFn: async () => {
      const updatedInvestment = {
        number_of_shares: parseInt(numberOfShares),
        share_price: parseFloat(sharePrice),
        capital_invested: parseFloat(capitalInvested),
        share_class_id: shareClassId,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('investments')
        .update(updatedInvestment)
        .eq('id', investment.id);
      
      if (error) throw new Error(`Error updating investment: ${error.message}`);
      
      // Get the round ID from the investment to update summary
      const { data: investmentData, error: fetchError } = await supabase
        .from('investments')
        .select('round_id')
        .eq('id', investment.id)
        .single();
      
      if (fetchError) throw new Error(`Error fetching investment data: ${fetchError.message}`);
      
      // Update the round summary
      await updateRoundSummary(investmentData.round_id);
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Investment updated",
        description: "Investment has been updated successfully."
      });
      setOpen(false);
      if (onInvestmentEdited) onInvestmentEdited();
    },
    onError: (error) => {
      toast({
        title: "Error updating investment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Helper function to update round summary
  const updateRoundSummary = async (roundId: string) => {
    // Calculate new totals for the round
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select('number_of_shares, capital_invested')
      .eq('round_id', roundId);
    
    if (investmentsError) throw new Error(`Error fetching investments: ${investmentsError.message}`);
    
    const totalShares = investments.reduce((sum, inv) => sum + (Number(inv.number_of_shares) || 0), 0);
    const totalCapital = investments.reduce((sum, inv) => sum + (Number(inv.capital_invested) || 0), 0);
    
    // Update the round summary
    const { data: summaries, error: summariesError } = await supabase
      .from('round_summaries')
      .select('id')
      .eq('round_id', roundId);
    
    if (summariesError) throw new Error(`Error fetching round summary: ${summariesError.message}`);
    
    if (summaries && summaries.length > 0) {
      // Update existing summary
      const { error: updateError } = await supabase
        .from('round_summaries')
        .update({
          total_shares: totalShares,
          total_capital: totalCapital,
          updated_at: new Date().toISOString()
        })
        .eq('round_id', roundId);
      
      if (updateError) throw new Error(`Error updating round summary: ${updateError.message}`);
    } else {
      // Create new summary
      const { error: insertError } = await supabase
        .from('round_summaries')
        .insert({
          round_id: roundId,
          total_shares: totalShares,
          total_capital: totalCapital
        });
      
      if (insertError) throw new Error(`Error creating round summary: ${insertError.message}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(numberOfShares) <= 0) {
      toast({
        title: "Validation error",
        description: "Number of shares must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    if (!shareClassId) {
      toast({
        title: "Validation error",
        description: "Please select a share class",
        variant: "destructive"
      });
      return;
    }
    
    updateInvestmentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit2 size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Investment</DialogTitle>
          <DialogDescription>
            Update investment details for {investment.shareholders?.name || 'shareholder'}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number-of-shares" className="text-right">
                Shares
              </Label>
              <Input
                id="number-of-shares"
                type="number"
                min="1"
                value={numberOfShares}
                onChange={(e) => handleSharesChange(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="share-price" className="text-right">
                Share Price
              </Label>
              <Input
                id="share-price"
                type="number"
                step="0.01"
                min="0"
                value={sharePrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="share-class" className="text-right">
                Share Class
              </Label>
              <div className="col-span-3">
                <Select value={shareClassId} onValueChange={setShareClassId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select share class" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareClasses.map(shareClass => (
                      <SelectItem key={shareClass.id} value={shareClass.id}>
                        {shareClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capital-invested" className="text-right">
                Capital Invested
              </Label>
              <Input
                id="capital-invested"
                type="number"
                step="0.01"
                min="0"
                value={capitalInvested}
                onChange={(e) => setCapitalInvested(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={updateInvestmentMutation.isPending}
            >
              {updateInvestmentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
