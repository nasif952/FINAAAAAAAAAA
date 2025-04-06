
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
import { formatCurrency } from '@/lib/formatters';

interface AddRoundDialogProps {
  trigger: React.ReactNode;
  isFoundation?: boolean;
  onRoundAdded?: () => void;
}

export function AddRoundDialog({ trigger, isFoundation = false, onRoundAdded }: AddRoundDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [valuation, setValuation] = useState('0');
  const { toast } = useToast();

  const addRoundMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('funding_rounds')
        .insert({
          name,
          valuation: parseFloat(valuation),
          is_foundation: isFoundation,
          date: new Date().toISOString()
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: `${isFoundation ? 'Foundation' : 'Funding'} round added`,
        description: `The ${name} round has been added successfully.`
      });
      setOpen(false);
      resetForm();
      if (onRoundAdded) onRoundAdded();
    },
    onError: (error) => {
      toast({
        title: `Error adding ${isFoundation ? 'foundation' : 'funding'} round`,
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setName('');
    setValuation('0');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "Round name is required",
        variant: "destructive"
      });
      return;
    }
    
    addRoundMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {isFoundation ? 'Foundation' : 'Funding'} Round</DialogTitle>
          <DialogDescription>
            {isFoundation 
              ? "Add a foundation round to establish the initial shares of your company."
              : "Add a funding round to record an investment into your company."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="round-name" className="text-right">
                Name
              </Label>
              <Input
                id="round-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder={isFoundation ? "e.g. Foundation Round" : "e.g. Seed Round"}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="valuation" className="text-right">
                Valuation
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="valuation"
                  type="number"
                  min="0"
                  value={valuation}
                  onChange={(e) => setValuation(e.target.value)}
                  className="pl-7"
                  placeholder="Company valuation"
                />
              </div>
            </div>
            {parseFloat(valuation) > 0 && (
              <div className="flex justify-end">
                <span className="text-sm text-muted-foreground">
                  Valuation: {formatCurrency(valuation, 0)}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={addRoundMutation.isPending}
            >
              {addRoundMutation.isPending ? "Adding..." : `Add ${isFoundation ? 'Foundation' : 'Funding'} Round`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
