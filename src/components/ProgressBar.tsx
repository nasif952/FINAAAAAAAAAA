
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  className?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'destructive' | 'green';
}

export function ProgressBar({
  value,
  max,
  label,
  className,
  showPercentage = true,
  color = 'primary'
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);
  
  const colorClasses = {
    primary: 'bg-primary',
    destructive: 'bg-destructive',
    green: 'bg-green-500',
  };
  
  return (
    <div className={className}>
      {label && <div className="text-sm text-muted-foreground mb-1">{label}</div>}
      <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-muted-foreground mt-1">{percentage}% Completed</div>
      )}
    </div>
  );
}
