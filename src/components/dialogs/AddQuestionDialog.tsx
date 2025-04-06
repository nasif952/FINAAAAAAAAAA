
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

interface AddQuestionDialogProps {
  trigger: React.ReactNode;
  questionnaireId: string;
  lastQuestionNumber: string;
  onQuestionAdded?: () => void;
}

export function AddQuestionDialog({ 
  trigger, 
  questionnaireId,
  lastQuestionNumber,
  onQuestionAdded 
}: AddQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [responseType, setResponseType] = useState('text');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate next question number logic
  const calculateNextQuestionNumber = () => {
    if (!lastQuestionNumber) return "1.1";
    
    const parts = lastQuestionNumber.split('.');
    if (parts.length !== 2) return "1.1";
    
    const section = parts[0];
    const number = parseInt(parts[1], 10);
    
    return `${section}.${number + 1}`;
  };

  const addQuestionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('questionnaire_questions')
        .insert({
          questionnaire_id: questionnaireId,
          question_number: calculateNextQuestionNumber(),
          question,
          response_type: responseType,
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire'] });
      toast({
        title: "Question added",
        description: "Your question has been added successfully."
      });
      setOpen(false);
      resetForm();
      if (onQuestionAdded) onQuestionAdded();
    },
    onError: (error) => {
      toast({
        title: "Error adding question",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setQuestion('');
    setResponseType('text');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast({
        title: "Validation error",
        description: "Question text is required",
        variant: "destructive"
      });
      return;
    }
    
    addQuestionMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Question</DialogTitle>
          <DialogDescription>
            Add a new custom question to this questionnaire section.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question" className="text-right">
                Question
              </Label>
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="col-span-3"
                placeholder="Enter your question"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responseType" className="text-right">
                Response Type
              </Label>
              <Select 
                value={responseType} 
                onValueChange={setResponseType}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select response type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4 text-sm text-muted-foreground">
              Question will be added as number {calculateNextQuestionNumber()}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={addQuestionMutation.isPending}
            >
              {addQuestionMutation.isPending ? "Adding..." : "Add Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
