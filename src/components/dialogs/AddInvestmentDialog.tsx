
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/lib/formatters';

interface Shareholder {
  id: string;
  name: string;
}

interface ShareClass {
  id: string;
  name: string;
}

interface AddInvestmentDialogProps {
  trigger: React.ReactNode;
  roundId: string;
  isFoundation?: boolean;
  onInvestmentAdded?: () => void;
}

export function AddInvestmentDialog({ 
  trigger, 
  roundId,
  isFoundation = false,
  onInvestmentAdded 
}: AddInvestmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [shareholderId, setShareholderId] = useState('');
  const [shareClassId, setShareClassId] = useState('common');
  const [numberOfShares, setNumberOfShares] = useState('0');
  const [sharePrice, setSharePrice] = useState('0.01');
  const [capitalInvested, setCapitalInvested] = useState('0');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch shareholders and share classes
  const { data: shareholders = [] } = useQuery({
    queryKey: ['shareholders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shareholders')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      return data as Shareholder[];
    },
  });

  const { data: shareClasses = [] } = useQuery({
    queryKey: ['shareClasses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('share_classes')
        .select('id, name');
        
      if (error) throw error;
      return data as ShareClass[];
    },
  });

  // Calculate capital invested whenever number of shares or share price changes
  useEffect(() => {
    const shares = parseFloat(numberOfShares) || 0;
    const price = parseFloat(sharePrice) || 0;
    setCapitalInvested((shares * price).toFixed(2));
  }, [numberOfShares, sharePrice]);

  const addInvestmentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('investments')
        .insert({
          round_id: roundId,
          shareholder_id: shareholderId,
          share_class_id: shareClassId === 'common' ? null : shareClassId,
          number_of_shares: parseInt(numberOfShares),
          share_price: parseFloat(sharePrice),
          capital_invested: parseFloat(capitalInvested)
        })
        .select();
        
      if (error) throw error;

      // Update round summary
      await updateRoundSummary();
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments', roundId] });
      queryClient.invalidateQueries({ queryKey: ['roundSummary', roundId] });
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
      toast({
        title: "Investment added",
        description: "The investment has been added successfully."
      });
      setOpen(false);
      resetForm();
      if (onInvestmentAdded) onInvestmentAdded();
    },
    onError: (error) => {
      toast({
        title: "Error adding investment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update or create the round summary
  const updateRoundSummary = async () => {
    // First check if a summary exists
    const { data: summaries } = await supabase
      .from('round_summaries')
      .select('*')
      .eq('round_id', roundId);
      
    // Get all investments for this round
    const { data: investments } = await supabase
      .from('investments')
      .select('number_of_shares, capital_invested')
      .eq('round_id', roundId);
      
    // Calculate totals
    const totalShares = (investments || []).reduce(
      (sum, inv) => sum + (inv.number_of_shares || 0), 
      parseInt(numberOfShares) || 0
    );
    
    const totalCapital = (investments || []).reduce(
      (sum, inv) => sum + (inv.capital_invested || 0), 
      parseFloat(capitalInvested) || 0
    );
    
    if (summaries && summaries.length > 0) {
      // Update existing summary
      await supabase
        .from('round_summaries')
        .update({
          total_shares: totalShares,
          total_capital: totalCapital,
          updated_at: new Date().toISOString()
        })
        .eq('round_id', roundId);
    } else {
      // Create new summary
      await supabase
        .from('round_summaries')
        .insert({
          round_id: roundId,
          total_shares: parseInt(numberOfShares) || 0,
          total_capital: parseFloat(capitalInvested) || 0
        });
    }
  };

  const resetForm = () => {
    setShareholderId('');
    setShareClassId('common');
    setNumberOfShares('0');
    setSharePrice('0.01');
    setCapitalInvested('0');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shareholderId) {
      toast({
        title: "Validation error",
        description: "Please select a shareholder",
        variant: "destructive"
      });
      return;
    }

    if (parseInt(numberOfShares) <= 0) {
      toast({
        title: "Validation error",
        description: "Number of shares must be greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    addInvestmentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Investment</DialogTitle>
          <DialogDescription>
            Add a new investment to the {isFoundation ? "foundation" : ""} round.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shareholder" className="text-right">
                Shareholder
              </Label>
              <div className="col-span-3">
                <Select value={shareholderId} onValueChange={setShareholderId}>
                  <SelectTrigger id="shareholder">
                    <SelectValue placeholder="Select a shareholder" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareholders.map((shareholder) => (
                      <SelectItem key={shareholder.id} value={shareholder.id}>
                        {shareholder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="share-class" className="text-right">
                Share Class
              </Label>
              <div className="col-span-3">
                <Select value={shareClassId} onValueChange={setShareClassId}>
                  <SelectTrigger id="share-class">
                    <SelectValue placeholder="Select a share class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common (Default)</SelectItem>
                    {shareClasses.map((shareClass) => (
                      <SelectItem key={shareClass.id} value={shareClass.id}>
                        {shareClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number-of-shares" className="text-right">
                # of Shares
              </Label>
              <Input
                id="number-of-shares"
                type="number"
                min="1"
                value={numberOfShares}
                onChange={(e) => setNumberOfShares(e.target.value)}
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
                min="0.01"
                step="0.01"
                value={sharePrice}
                onChange={(e) => setSharePrice(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capital-invested" className="text-right">
                Capital
              </Label>
              <div className="col-span-3 flex items-center px-3 h-10 rounded-md border border-input bg-background text-muted-foreground">
                {formatCurrency(capitalInvested)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={addInvestmentMutation.isPending}
            >
              {addInvestmentMutation.isPending ? "Adding..." : "Add Investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
