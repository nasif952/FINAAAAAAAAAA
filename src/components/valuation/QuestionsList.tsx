
import { AddQuestionDialog } from '@/components/dialogs/AddQuestionDialog';
import { Button } from '@/components/Button';
import { PlusCircle } from 'lucide-react';
import { QuestionItem } from './QuestionItem';

interface QuestionsListProps {
  questions: any[];
  questionnaireId: string;
  currentStep: number;
  lastQuestionNumber: string;
  onQuestionAdded: () => void;
  onResponseChange: (questionId: string, value: string | number | boolean) => void;
}

export function QuestionsList({ 
  questions, 
  questionnaireId, 
  currentStep, 
  lastQuestionNumber, 
  onQuestionAdded,
  onResponseChange 
}: QuestionsListProps) {
  if (!questions || questions.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground mb-4">No questions yet for this section.</p>
        <AddQuestionDialog
          trigger={
            <Button variant="outline">
              <PlusCircle size={16} className="mr-2" />
              Add your first question
            </Button>
          }
          questionnaireId={questionnaireId}
          lastQuestionNumber={`${currentStep}.1`}
          onQuestionAdded={onQuestionAdded}
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {questions.map((question) => (
        <QuestionItem 
          key={question.id}
          questionId={question.id}
          number={question.question_number} 
          question={question.question}
          responseType={question.response_type}
          options={question.options}
          currentResponse={question.response || ''}
          onResponseChange={onResponseChange}
        />
      ))}
    </div>
  );
}
