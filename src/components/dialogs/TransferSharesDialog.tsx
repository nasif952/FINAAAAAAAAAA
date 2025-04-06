
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Shareholder {
  id: string;
  name: string;
  total_shares?: number;
}

interface TransferSharesDialogProps {
  trigger: React.ReactNode;
  shareholders: Shareholder[];
  onSharesTransferred?: () => void;
}

export function TransferSharesDialog({ trigger, shareholders, onSharesTransferred }: TransferSharesDialogProps) {
  const [open, setOpen] = useState(false);
  const [fromShareholderId, setFromShareholderId] = useState('');
  const [toShareholderId, setToShareholderId] = useState('');
  const [numberOfShares, setNumberOfShares] = useState('0');
  const { toast } = useToast();

  // Implement the actual share transfer functionality
  const transferSharesMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Get the "from" shareholder's current shares
      const { data: fromShareholder, error: fromError } = await supabase
        .from('shareholders')
        .select('*')
        .eq('id', fromShareholderId)
        .single();
      
      if (fromError) throw new Error(`Could not find source shareholder: ${fromError.message}`);

      // Step 2: Create a new investment record for the "to" shareholder
      // We'll use the most recent foundation round for simplicity
      const { data: foundationRound, error: roundError } = await supabase
        .from('funding_rounds')
        .select('id')
        .eq('is_foundation', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (roundError) throw new Error(`Could not find foundation round: ${roundError.message}`);
      
      // Step 3: Get a share class (we'll use the first available one)
      const { data: shareClass, error: shareClassError } = await supabase
        .from('share_classes')
        .select('id')
        .limit(1)
        .single();
      
      if (shareClassError) throw new Error(`Could not find share class: ${shareClassError.message}`);
      
      // Step 4: Create a new investment record with transferred shares
      const sharesToTransfer = parseInt(numberOfShares);
      
      // For the transfer, we need to:
      // 1. Add shares to the destination shareholder
      const { error: insertError } = await supabase
        .from('investments')
        .insert({
          shareholder_id: toShareholderId,
          round_id: foundationRound.id,
          share_class_id: shareClass.id,
          number_of_shares: sharesToTransfer,
          share_price: 0, // This is a transfer, not a purchase
          capital_invested: 0 // This is a transfer, not a purchase
        });
      
      if (insertError) throw new Error(`Error adding shares: ${insertError.message}`);
      
      // 2. Subtract shares from the source shareholder by creating a negative investment
      const { error: subtractError } = await supabase
        .from('investments')
        .insert({
          shareholder_id: fromShareholderId,
          round_id: foundationRound.id,
          share_class_id: shareClass.id,
          number_of_shares: -sharesToTransfer, // Negative number to reduce shares
          share_price: 0, // This is a transfer, not a sale
          capital_invested: 0 // This is a transfer, not a sale
        });
      
      if (subtractError) throw new Error(`Error subtracting shares: ${subtractError.message}`);
      
      // Update the round totals
      await updateRoundSummary(foundationRound.id);

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Shares transferred",
        description: `${numberOfShares} shares have been transferred successfully.`
      });
      setOpen(false);
      resetForm();
      if (onSharesTransferred) onSharesTransferred();
    },
    onError: (error) => {
      console.error("Transfer error:", error);
      toast({
        title: "Error transferring shares",
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

  const resetForm = () => {
    setFromShareholderId('');
    setToShareholderId('');
    setNumberOfShares('0');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromShareholderId || !toShareholderId) {
      toast({
        title: "Validation error",
        description: "You must select both a sender and a receiver",
        variant: "destructive"
      });
      return;
    }
    
    if (fromShareholderId === toShareholderId) {
      toast({
        title: "Validation error",
        description: "Cannot transfer shares to the same shareholder",
        variant: "destructive"
      });
      return;
    }
    
    if (parseInt(numberOfShares) <= 0) {
      toast({
        title: "Validation error",
        description: "Number of shares must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    transferSharesMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Shares</DialogTitle>
          <DialogDescription>
            Transfer shares between shareholders.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="from-shareholder" className="text-right">
                From
              </Label>
              <div className="col-span-3">
                <Select value={fromShareholderId} onValueChange={setFromShareholderId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select shareholder" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareholders.map(shareholder => (
                      <SelectItem key={shareholder.id} value={shareholder.id}>
                        {shareholder.name} {shareholder.total_shares ? `(${shareholder.total_shares} shares)` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="to-shareholder" className="text-right">
                To
              </Label>
              <div className="col-span-3">
                <Select value={toShareholderId} onValueChange={setToShareholderId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select shareholder" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareholders.map(shareholder => (
                      <SelectItem key={shareholder.id} value={shareholder.id}>
                        {shareholder.name} {shareholder.total_shares ? `(${shareholder.total_shares} shares)` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number-of-shares" className="text-right">
                Shares
              </Label>
              <Input
                id="number-of-shares"
                type="number"
                min="1"
                value={numberOfShares}
                onChange={(e) => setNumberOfShares(e.target.value)}
                className="col-span-3"
                placeholder="Number of shares to transfer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={transferSharesMutation.isPending}
            >
              {transferSharesMutation.isPending ? "Transferring..." : "Transfer Shares"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
