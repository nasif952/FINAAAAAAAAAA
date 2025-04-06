import { teamQuestions } from '@/utils/team-questions';
import { productQuestions } from '@/utils/product-questions';
import { marketQuestions } from '@/utils/market-questions';
import { businessModelQuestions } from '@/utils/business-model-questions';
import { competitionQuestions } from '@/utils/competition-questions';
import { financialsQuestions } from '@/utils/financials-questions';
import { futureQuestions } from '@/utils/future-questions';

export function getDefaultQuestions(stepNumber: number, questionnaireId: string): any[] {
  // Map step number to the corresponding question set
  switch (stepNumber) {
    case 1: // Team
      return teamQuestions.map(q => ({
        ...q,
        questionnaire_id: questionnaireId
      }));
    
    case 2: // Product
      return productQuestions.map(q => ({
        ...q,
        questionnaire_id: questionnaireId
      }));
    
    case 3: // Market
      return marketQuestions.map(q => ({
        ...q,
        questionnaire_id: questionnaireId
      }));
    
    case 4: // Business Model
      return businessModelQuestions.map(q => ({
        ...q,
        questionnaire_id: questionnaireId
      }));
    
    case 5: // Competition
      return competitionQuestions.map(q => ({
        ...q,
        questionnaire_id: questionnaireId
      }));
    
    case 6: // Financials
      return financialsQuestions.map(q => ({
        ...q,
        questionnaire_id: questionnaireId
      }));
    
    case 7: // Future
      return futureQuestions.map(q => ({
        ...q,
        questionnaire_id: questionnaireId
      }));
    
    default:
      return [];
  }
}
