
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

interface Shareholder {
  id: string;
  name: string;
  contact?: string;
}

interface EditShareholderDialogProps {
  shareholder: Shareholder;
  onShareholderEdited?: () => void;
}

export function EditShareholderDialog({ shareholder, onShareholderEdited }: EditShareholderDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(shareholder.name);
  const [contact, setContact] = useState(shareholder.contact || '');
  const { toast } = useToast();

  const updateShareholderMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shareholders')
        .update({
          name,
          contact,
          updated_at: new Date().toISOString()
        })
        .eq('id', shareholder.id);
      
      if (error) throw new Error(`Error updating shareholder: ${error.message}`);
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Shareholder updated",
        description: `${name} has been updated successfully.`
      });
      setOpen(false);
      if (onShareholderEdited) onShareholderEdited();
    },
    onError: (error) => {
      toast({
        title: "Error updating shareholder",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({
        title: "Validation error",
        description: "Shareholder name is required",
        variant: "destructive"
      });
      return;
    }
    
    updateShareholderMutation.mutate();
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
          <DialogTitle>Edit Shareholder</DialogTitle>
          <DialogDescription>
            Update shareholder information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shareholder-name" className="text-right">
                Name
              </Label>
              <Input
                id="shareholder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shareholder-contact" className="text-right">
                Contact
              </Label>
              <Input
                id="shareholder-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={updateShareholderMutation.isPending}
            >
              {updateShareholderMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
