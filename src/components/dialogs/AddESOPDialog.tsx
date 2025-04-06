
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

interface AddESOPDialogProps {
  trigger: React.ReactNode;
  onESOPAdded?: () => void;
}

export function AddESOPDialog({ trigger, onESOPAdded }: AddESOPDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [totalShares, setTotalShares] = useState('0');
  const [vestingPeriod, setVestingPeriod] = useState('4 years');
  const { toast } = useToast();

  const addESOPMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('esops')
        .insert({
          name,
          total_shares: parseInt(totalShares),
          vesting_period: vestingPeriod
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "ESOP added",
        description: `The ${name} ESOP has been added successfully.`
      });
      setOpen(false);
      resetForm();
      if (onESOPAdded) onESOPAdded();
    },
    onError: (error) => {
      toast({
        title: "Error adding ESOP",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setName('');
    setTotalShares('0');
    setVestingPeriod('4 years');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "ESOP name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (parseInt(totalShares) <= 0) {
      toast({
        title: "Validation error",
        description: "Total shares must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    addESOPMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add ESOP Plan</DialogTitle>
          <DialogDescription>
            Create a new Employee Stock Ownership Plan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="esop-name" className="text-right">
                Plan Name
              </Label>
              <Input
                id="esop-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Employee Option Pool 2025"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total-shares" className="text-right">
                Total Shares
              </Label>
              <Input
                id="total-shares"
                type="number"
                min="1"
                value={totalShares}
                onChange={(e) => setTotalShares(e.target.value)}
                className="col-span-3"
                placeholder="Number of shares in the plan"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vesting-period" className="text-right">
                Vesting
              </Label>
              <div className="col-span-3">
                <Select value={vestingPeriod} onValueChange={setVestingPeriod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vesting period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 year">1 year</SelectItem>
                    <SelectItem value="2 years">2 years</SelectItem>
                    <SelectItem value="3 years">3 years</SelectItem>
                    <SelectItem value="4 years">4 years (Standard)</SelectItem>
                    <SelectItem value="5 years">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={addESOPMutation.isPending}
            >
              {addESOPMutation.isPending ? "Adding..." : "Add ESOP Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
