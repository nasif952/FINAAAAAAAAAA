
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

interface AddLoanDialogProps {
  trigger: React.ReactNode;
  onLoanAdded?: () => void;
}

export function AddLoanDialog({ trigger, onLoanAdded }: AddLoanDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('0');
  const [interestRate, setInterestRate] = useState('0');
  const [termMonths, setTermMonths] = useState('12');
  const { toast } = useToast();

  const addLoanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .insert({
          name,
          amount: parseFloat(amount),
          interest_rate: parseFloat(interestRate),
          term_months: parseInt(termMonths)
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Loan added",
        description: `The ${name} loan has been added successfully.`
      });
      setOpen(false);
      resetForm();
      if (onLoanAdded) onLoanAdded();
    },
    onError: (error) => {
      toast({
        title: "Error adding loan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setName('');
    setAmount('0');
    setInterestRate('0');
    setTermMonths('12');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "Loan name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (parseFloat(amount) <= 0) {
      toast({
        title: "Validation error",
        description: "Loan amount must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    addLoanMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Loan</DialogTitle>
          <DialogDescription>
            Add a new loan or debt instrument to your cap table.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="loan-name" className="text-right">
                Name
              </Label>
              <Input
                id="loan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Convertible Note 2025"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                placeholder="Loan amount"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interest-rate" className="text-right">
                Interest Rate
              </Label>
              <Input
                id="interest-rate"
                type="number"
                min="0"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="col-span-3"
                placeholder="Annual interest rate (%)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="term-months" className="text-right">
                Term
              </Label>
              <Input
                id="term-months"
                type="number"
                min="1"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="col-span-3"
                placeholder="Loan term in months"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={addLoanMutation.isPending}
            >
              {addLoanMutation.isPending ? "Adding..." : "Add Loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
