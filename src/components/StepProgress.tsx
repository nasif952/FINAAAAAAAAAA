
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  label: string;
  isCompleted?: boolean;
  isActive?: boolean;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {/* Horizontal line connecting all steps */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-10" />
        
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          
          return (
            <div key={step.number} className="flex flex-col items-center relative">
              {/* Line connecting steps */}
              {index < steps.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      isCompleted ? "bg-primary" : "bg-gray-200"
                    )}
                  />
                </div>
              )}
              
              {/* Step circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 z-10",
                  isActive
                    ? "bg-primary text-white"
                    : isCompleted
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {step.number}
              </div>
              
              {/* Step label */}
              <span
                className={cn(
                  "mt-2 text-xs whitespace-nowrap",
                  isActive ? "text-primary font-medium" : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
