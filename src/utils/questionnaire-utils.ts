
/**
 * Returns the title of a questionnaire step based on its number
 */
export function getStepTitle(stepNumber: number): string | null {
  const stepTitles = [
    'Team', 'Product', 'Market', 'Business Model', 'Competition', 'Financials', 'Future'
  ];
  return stepTitles[stepNumber - 1] || null;
}

/**
 * Creates the steps array for StepProgress component
 */
export function createStepsArray(totalSteps: number, currentStep: number): Array<{number: number, label: string, isActive: boolean}> {
  return Array.from({ length: totalSteps }, (_, i) => {
    const stepNumber = i + 1;
    return { 
      number: stepNumber, 
      label: getStepTitle(stepNumber) || `Step ${stepNumber}`,
      isActive: stepNumber === currentStep
    };
  });
}

/**
 * Gets business sector-specific questions for a questionnaire section
 */
export function getSectorSpecificQuestions(sector: string, section: number): Array<{question: string, type: string}> {
  // This is just a placeholder for potential future enhancement
  // You could implement industry-specific questions based on the company's sector
  return [];
}
