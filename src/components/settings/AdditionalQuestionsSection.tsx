
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { extendedSupabase } from "@/integrations/supabase/client-extension";
import { useToast } from "@/hooks/use-toast";
import { BusinessQuestion, Company } from "@/integrations/supabase/client-extension";
import { useEffect } from "react";

const questionsSchema = z.object({
  problem_solving: z.string().optional(),
  solution: z.string().optional(),
  why_now: z.string().optional(),
  business_model: z.string().optional(),
  founding_team_gender: z.string().optional(),
});

interface AdditionalQuestionsSectionProps {
  questionsData: BusinessQuestion | null;
  companyData: Company | null;
}

export function AdditionalQuestionsSection({ questionsData, companyData }: AdditionalQuestionsSectionProps) {
  const { toast } = useToast();

  const questionsForm = useForm({
    resolver: zodResolver(questionsSchema),
    defaultValues: {
      problem_solving: "",
      solution: "",
      why_now: "",
      business_model: "",
      founding_team_gender: "",
    },
  });

  useEffect(() => {
    if (questionsData) {
      questionsForm.reset({
        problem_solving: questionsData.problem_solving || "",
        solution: questionsData.solution || "",
        why_now: questionsData.why_now || "",
        business_model: questionsData.business_model || "",
        founding_team_gender: questionsData.founding_team_gender || "",
      });
    }
  }, [questionsData, questionsForm]);

  const updateQuestions = useMutation({
    mutationFn: async (values: any) => {
      if (!companyData?.id) throw new Error("Company not found");
      
      if (questionsData?.id) {
        // Update existing record
        const { error } = await extendedSupabase
          .from('business_questions')
          .update({
            problem_solving: values.problem_solving,
            solution: values.solution,
            why_now: values.why_now,
            business_model: values.business_model,
            founding_team_gender: values.founding_team_gender,
          })
          .eq('id', questionsData.id);
        
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await extendedSupabase
          .from('business_questions')
          .insert({
            company_id: companyData.id,
            problem_solving: values.problem_solving,
            solution: values.solution,
            why_now: values.why_now,
            business_model: values.business_model,
            founding_team_gender: values.founding_team_gender,
          });
        
        if (error) throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Questions updated",
        description: "Your additional questions have been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (values: any) => {
    updateQuestions.mutate(values);
  };

  return (
    <Form {...questionsForm}>
      <form onSubmit={questionsForm.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={questionsForm.control}
            name="problem_solving"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What problem is your company solving?</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the problem your company is addressing..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={questionsForm.control}
            name="solution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How does your solution work?</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your solution in detail..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={questionsForm.control}
            name="why_now"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Why now?</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Explain why this is the right time for your solution..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={questionsForm.control}
            name="business_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Model</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your business model..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={questionsForm.control}
            name="founding_team_gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Founding Team Gender</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender composition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="All Male">All Male</SelectItem>
                    <SelectItem value="Male Majority">Male Majority</SelectItem>
                    <SelectItem value="Equal">Equal Gender Split</SelectItem>
                    <SelectItem value="Female Majority">Female Majority</SelectItem>
                    <SelectItem value="All Female">All Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="mt-6"
          disabled={updateQuestions.isPending}
        >
          {updateQuestions.isPending ? "Updating..." : "Update Additional Questions"}
        </Button>
      </form>
    </Form>
  );
}
