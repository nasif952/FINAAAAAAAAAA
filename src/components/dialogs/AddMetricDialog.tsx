
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddMetricDialogProps {
  trigger: React.ReactNode;
  onMetricAdded?: () => void;
}

export function AddMetricDialog({ trigger, onMetricAdded }: AddMetricDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Currency');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addMetricMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .insert({
          name,
          description,
          unit,
          is_custom: true
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast({
        title: "Metric added",
        description: "Your custom metric has been added successfully."
      });
      setOpen(false);
      resetForm();
      if (onMetricAdded) onMetricAdded();
    },
    onError: (error) => {
      toast({
        title: "Error adding metric",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setUnit('Currency');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "Metric name is required",
        variant: "destructive"
      });
      return;
    }
    
    addMetricMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Metric</DialogTitle>
          <DialogDescription>
            Create a new custom metric to track your performance.
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
                placeholder="e.g. Customer Acquisition Cost"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Brief description of this metric"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">
                Unit
              </Label>
              <Select 
                value={unit} 
                onValueChange={setUnit}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Currency">Currency</SelectItem>
                  <SelectItem value="Percentage">Percentage</SelectItem>
                  <SelectItem value="Numbers">Numbers</SelectItem>
                  <SelectItem value="Time">Time</SelectItem>
                  <SelectItem value="Ratio">Ratio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={addMetricMutation.isPending}
            >
              {addMetricMutation.isPending ? "Adding..." : "Add Metric"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
