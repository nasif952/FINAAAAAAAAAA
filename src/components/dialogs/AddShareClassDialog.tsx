
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
import { Switch } from '@/components/ui/switch';

interface AddShareClassDialogProps {
  trigger: React.ReactNode;
  onShareClassAdded?: () => void;
}

export function AddShareClassDialog({ trigger, onShareClassAdded }: AddShareClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [rights, setRights] = useState('');
  const [votingRights, setVotingRights] = useState(false);
  const [preferredDividend, setPreferredDividend] = useState('0');
  const { toast } = useToast();

  const addShareClassMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('share_classes')
        .insert({
          name,
          rights,
          voting_rights: votingRights,
          preferred_dividend: parseFloat(preferredDividend)
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Share class added",
        description: `The ${name} share class has been added successfully.`
      });
      setOpen(false);
      resetForm();
      if (onShareClassAdded) onShareClassAdded();
    },
    onError: (error) => {
      toast({
        title: "Error adding share class",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setName('');
    setRights('');
    setVotingRights(false);
    setPreferredDividend('0');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "Share class name is required",
        variant: "destructive"
      });
      return;
    }
    
    addShareClassMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Share Class</DialogTitle>
          <DialogDescription>
            Create a new share class for your cap table.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="class-name" className="text-right">
                Name
              </Label>
              <Input
                id="class-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Class A Common"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rights" className="text-right">
                Rights
              </Label>
              <Input
                id="rights"
                value={rights}
                onChange={(e) => setRights(e.target.value)}
                className="col-span-3"
                placeholder="Description of rights"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="preferred-dividend" className="text-right">
                Dividend (%)
              </Label>
              <Input
                id="preferred-dividend"
                type="number"
                min="0"
                step="0.01"
                value={preferredDividend}
                onChange={(e) => setPreferredDividend(e.target.value)}
                className="col-span-3"
                placeholder="Preferred dividend percentage"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="voting-rights" className="text-right">
                Voting Rights
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch 
                  id="voting-rights" 
                  checked={votingRights} 
                  onCheckedChange={setVotingRights} 
                />
                <Label htmlFor="voting-rights">
                  {votingRights ? 'Yes' : 'No'}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={addShareClassMutation.isPending}
            >
              {addShareClassMutation.isPending ? "Adding..." : "Add Share Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
