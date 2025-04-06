
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

interface AddShareholderDialogProps {
  trigger: React.ReactNode;
  onShareholderAdded?: () => void;
}

export function AddShareholderDialog({ trigger, onShareholderAdded }: AddShareholderDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addShareholderMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('shareholders')
        .insert({
          name,
          contact
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
      toast({
        title: "Shareholder added",
        description: "The shareholder has been added successfully."
      });
      setOpen(false);
      resetForm();
      if (onShareholderAdded) onShareholderAdded();
    },
    onError: (error) => {
      toast({
        title: "Error adding shareholder",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setName('');
    setContact('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "Shareholder name is required",
        variant: "destructive"
      });
      return;
    }
    
    addShareholderMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Shareholder</DialogTitle>
          <DialogDescription>
            Add a new investor or shareholder to your cap table.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Shareholder name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">
                Contact
              </Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="col-span-3"
                placeholder="Email or phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={addShareholderMutation.isPending}
            >
              {addShareholderMutation.isPending ? "Adding..." : "Add Shareholder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
