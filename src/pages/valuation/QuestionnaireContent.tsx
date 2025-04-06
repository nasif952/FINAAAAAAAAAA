import { useState } from 'react';
import { Button } from '@/components/Button';
import { StepProgress } from '@/components/StepProgress';
import { Loader2, ChevronRight, PlusCircle, RefreshCw, Brain, BarChart4 } from 'lucide-react';
import { AddQuestionDialog } from '@/components/dialogs/AddQuestionDialog';
import { createStepsArray, getStepTitle } from '@/utils/questionnaire-utils';
import { useQuestionnaireData } from '@/hooks/useQuestionnaireData';
import { QuestionsList } from '@/components/valuation/QuestionsList';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface QuestionnaireContentProps {
  setActiveTab: (tab: string) => void;
}

export function QuestionnaireContent({ setActiveTab }: QuestionnaireContentProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const { 
    questionnaireData, 
    loadingQuestionnaire, 
    isSaving,
    handleResponseChange,
    handleSaveAndNext,
    getLastQuestionNumber,
    resetQuestionnaire
  } = useQuestionnaireData(currentStep);
  
  const steps = createStepsArray(7, currentStep);
  
  const handleQuestionAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['questionnaire', currentStep] });
  };
  
  if (loadingQuestionnaire) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading questionnaire...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Questionnaire Progress</h1>
        <p className="text-muted-foreground mb-6">Attract investors with an optimized CompanyBench! Let's continue →</p>
        
        <StepProgress steps={steps} currentStep={currentStep} className="mb-8" />
        
        <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
          <h2 className="text-xl font-semibold">
            Step {currentStep}: {getStepTitle(currentStep)}
          </h2>
          
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <RefreshCw size={16} />
                  <span>Reset Questions</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Questionnaire</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all questions for this step to the default questions. Any responses will be lost. Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetQuestionnaire}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {questionnaireData?.questionnaire && (
              <AddQuestionDialog
                trigger={
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <PlusCircle size={16} />
                    <span>Add Question</span>
                  </Button>
                }
                questionnaireId={questionnaireData.questionnaire.id}
                lastQuestionNumber={getLastQuestionNumber()}
                onQuestionAdded={handleQuestionAdded}
              />
            )}
          </div>
        </div>
      </div>
      
      {questionnaireData?.questionnaire && (
        <QuestionsList
          questions={questionnaireData.questions}
          questionnaireId={questionnaireData.questionnaire.id}
          currentStep={currentStep}
          lastQuestionNumber={getLastQuestionNumber()}
          onQuestionAdded={handleQuestionAdded}
          onResponseChange={handleResponseChange}
        />
      )}
      
      <div className="flex justify-between pt-6">
        <Button 
          variant="outline"
          disabled={currentStep === 1 || isSaving}
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
        >
          Back
        </Button>
        <div className="flex gap-2">
          {currentStep === 7 && (
            <>
              <Button 
                variant="outline"
                onClick={() => {
                  handleSaveAndNext();
                  navigate('/valuation?tab=visualization');
                }}
                isLoading={isSaving}
                className="flex items-center gap-2"
              >
                <BarChart4 size={16} />
                <span>Complete & View Visuals</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  handleSaveAndNext();
                  navigate('/valuation?tab=assessment');
                }}
                isLoading={isSaving}
                className="flex items-center gap-2"
              >
                <Brain size={16} />
                <span>Complete & Get AI Assessment</span>
              </Button>
            </>
          )}
          <Button 
            onClick={() => {
              handleSaveAndNext();
              
              if (currentStep < 7) {
                setCurrentStep(currentStep + 1);
              } else {
                navigate('/valuation?tab=benchmarks');
              }
            }}
            isLoading={isSaving}
            iconRight={<ChevronRight size={16} />}
          >
            {currentStep === 7 ? "Complete & Calculate" : "Save and Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
