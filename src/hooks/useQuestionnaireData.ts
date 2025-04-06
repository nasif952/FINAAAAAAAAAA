import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getStepTitle } from '@/utils/questionnaire-utils';
import { getDefaultQuestions } from '@/utils/default-questions';

export function useQuestionnaireData(currentStep: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  
  // Query to fetch/initialize questionnaire
  const { data: questionnaireData, isLoading: loadingQuestionnaire } = useQuery({
    queryKey: ['questionnaire', currentStep],
    queryFn: async () => {
      // First, check if we have a questionnaire for the current step
      const { data: questionnaires, error: questionnaireError } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('step_number', currentStep);
      
      if (questionnaireError) {
        toast({
          title: "Error loading questionnaire",
          description: questionnaireError.message,
          variant: "destructive"
        });
        return null;
      }
      
      // If no questionnaire exists for this step, create one
      if (!questionnaires || questionnaires.length === 0) {
        const stepTitle = getStepTitle(currentStep);
        
        if (!stepTitle) {
          toast({
            title: "Invalid step",
            description: "Could not find a title for this step",
            variant: "destructive"
          });
          return null;
        }
        
        // Get the company ID
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
          .single();
        
        if (companyError) {
          toast({
            title: "Error fetching company data",
            description: companyError.message,
            variant: "destructive"
          });
          return null;
        }
        
        // Check if there's already a valuation
        const { data: existingValuation, error: valuationError } = await supabase
          .from('valuations')
          .select('id')
          .limit(1);
        
        // Create or use existing valuation
        let valuationId;
        
        if (!existingValuation || existingValuation.length === 0) {
          // Create a new valuation
          const { data: newValuation, error: createValuationError } = await supabase
            .from('valuations')
            .insert({
              company_id: companyData.id,
              selected_valuation: 0,
              valuation_min: 100,
              valuation_max: 10000
            })
            .select('id')
            .single();
          
          if (createValuationError) {
            toast({
              title: "Error creating valuation",
              description: createValuationError.message,
              variant: "destructive"
            });
            return null;
          }
          
          valuationId = newValuation.id;
        } else {
          valuationId = existingValuation[0].id;
        }
        
        // Create default questionnaire for this step
        const { data: newQuestionnaire, error: createError } = await supabase
          .from('questionnaires')
          .insert({
            step: stepTitle.toLowerCase().replace(/\s+/g, '_'),
            step_number: currentStep,
            title: stepTitle,
            status: 'incomplete',
            valuation_id: valuationId // Use the actual valuation ID
          })
          .select()
          .single();
        
        if (createError) {
          toast({
            title: "Error creating questionnaire",
            description: createError.message,
            variant: "destructive"
          });
          return null;
        }
        
        // Create default questions based on the step
        const defaultQuestions = getDefaultQuestions(currentStep, newQuestionnaire.id);
        
        if (defaultQuestions.length > 0) {
          const { error: questionsError } = await supabase
            .from('questionnaire_questions')
            .insert(defaultQuestions);
          
          if (questionsError) {
            toast({
              title: "Error creating default questions",
              description: questionsError.message,
              variant: "destructive"
            });
          }
        }
        
        // Re-fetch the data after creating
        const { data: refreshedQuestionnaires, error: refreshError } = await supabase
          .from('questionnaires')
          .select('*')
          .eq('step_number', currentStep)
          .limit(1)
          .single();
        
        if (refreshError) {
          toast({
            title: "Error refreshing questionnaire",
            description: refreshError.message,
            variant: "destructive"
          });
          return null;
        }
        
        questionnaires[0] = refreshedQuestionnaires;
      } else {
        // Questionnaire exists, check if we need to update the questions to match latest defaults
        await syncQuestionnaireWithLatestDefaults(questionnaires[0].id, currentStep);
      }
      
      // Fetch questions for this questionnaire
      const { data: questions, error: questionsError } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .eq('questionnaire_id', questionnaires[0].id)
        .order('question_number');
      
      if (questionsError) {
        toast({
          title: "Error loading questions",
          description: questionsError.message,
          variant: "destructive"
        });
        return null;
      }
      
      return {
        questionnaire: questionnaires[0],
        questions: questions || []
      };
    },
    refetchOnWindowFocus: false
  });
  
  // Save responses mutation
  const saveResponsesMutation = useMutation({
    mutationFn: async ({ questionId, response }: { questionId: string, response: string | number | boolean }) => {
      const { data, error } = await supabase
        .from('questionnaire_questions')
        .update({ response: response.toString() })
        .eq('id', questionId)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire', currentStep] });
    },
    onError: (error) => {
      toast({
        title: "Error saving response",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Save and proceed to next step
  const saveAndNextMutation = useMutation({
    mutationFn: async () => {
      if (!questionnaireData?.questionnaire) return null;
      
      const allQuestionsAnswered = areAllQuestionsAnswered(questionnaireData.questions);
      
      const { data, error } = await supabase
        .from('questionnaires')
        .update({ 
          status: allQuestionsAnswered ? 'complete' : 'incomplete' 
        })
        .eq('id', questionnaireData.questionnaire.id)
        .select();
        
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire'] });
      toast({
        title: "Progress saved",
        description: "Your answers have been saved successfully."
      });
      setIsSaving(false);
    },
    onError: (error) => {
      toast({
        title: "Error saving progress",
        description: error.message,
        variant: "destructive"
      });
      setIsSaving(false);
    }
  });

  const handleResponseChange = (questionId: string, value: string | number | boolean) => {
    saveResponsesMutation.mutate({ questionId, response: value });
  };
  
  const handleSaveAndNext = () => {
    setIsSaving(true);
    saveAndNextMutation.mutate();
  };
  
  const getLastQuestionNumber = () => {
    if (!questionnaireData?.questions || questionnaireData.questions.length === 0) {
      return `${currentStep}.0`;
    }
    
    return questionnaireData.questions[questionnaireData.questions.length - 1].question_number;
  };

  // Function to reset the questionnaire for the current step
  const resetQuestionnaire = async () => {
    if (!questionnaireData?.questionnaire) return;
    
    setIsSaving(true);
    
    try {
      // Delete existing questions
      await supabase
        .from('questionnaire_questions')
        .delete()
        .eq('questionnaire_id', questionnaireData.questionnaire.id);
      
      // Create default questions based on the step
      const defaultQuestions = getDefaultQuestions(currentStep, questionnaireData.questionnaire.id);
      
      if (defaultQuestions.length > 0) {
        await supabase
          .from('questionnaire_questions')
          .insert(defaultQuestions);
      }
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['questionnaire', currentStep] });
      
      toast({
        title: "Questionnaire reset",
        description: "The questionnaire has been reset with the latest questions."
      });
    } catch (error) {
      toast({
        title: "Error resetting questionnaire",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { 
    questionnaireData, 
    loadingQuestionnaire, 
    isSaving, 
    handleResponseChange, 
    handleSaveAndNext,
    getLastQuestionNumber,
    resetQuestionnaire
  };
}

// Helper function to check if all questions are answered
function areAllQuestionsAnswered(questions: any[]): boolean {
  if (!questions || questions.length === 0) return false;
  return questions.every(q => q.response && q.response.trim() !== '');
}

// Function to sync questionnaire with latest default questions
async function syncQuestionnaireWithLatestDefaults(questionnaireId: string, stepNumber: number) {
  try {
    // Get current questions
    const { data: currentQuestions } = await supabase
      .from('questionnaire_questions')
      .select('question_number, id')
      .eq('questionnaire_id', questionnaireId);
    
    if (!currentQuestions) return;
    
    // Get default questions for this step
    const defaultQuestions = getDefaultQuestions(stepNumber, questionnaireId);
    
    // Find questions to add (questions in default but not in current)
    const currentQuestionNumbers = currentQuestions.map(q => q.question_number);
    const questionsToAdd = defaultQuestions.filter(q => !currentQuestionNumbers.includes(q.question_number));
    
    // Add new questions if any
    if (questionsToAdd.length > 0) {
      await supabase
        .from('questionnaire_questions')
        .insert(questionsToAdd);
    }
    
  } catch (error) {
    console.error("Error syncing questionnaire with latest defaults:", error);
  }
}
