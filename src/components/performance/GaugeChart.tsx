import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters'; // Assuming formatters handle null/undefined
import { Card } from '@/components/ui/card'; // Import Card

interface GaugeChartProps {
  value: number | null | undefined;
  target: number | null | undefined;
  label: string;
  unit?: '%' | '$' | '#'; // Specify unit for formatting and potentially target logic
  maxGaugeValue?: number; // Optional override for gauge scale
}

export function GaugeChart({ value, target, label, unit, maxGaugeValue }: GaugeChartProps) {
  const validValue = value ?? 0;
  const validTarget = target ?? 0;

  // Determine the max value for the gauge scale
  // Use override if provided, otherwise use target, or default to 100 for percentages, or 1.5*value otherwise
  const gaugeMax = maxGaugeValue ??
                   (validTarget > 0 ? Math.max(validTarget * 1.25, validValue * 1.1) : // Ensure scale accommodates value even if target is low
                   (unit === '%' ? 100 : Math.max(validValue * 1.5, 1))); // Default max for percentage or value-based

  const percentage = gaugeMax > 0 ? Math.min(Math.max((validValue / gaugeMax) * 100, 0), 100) : 0;

  const radius = 40;
  const circumference = 2 * Math.PI * radius; 
  const offset = circumference - (percentage / 100) * circumference;

  // Formatting based on unit
  let displayValue: string;
  switch (unit) {
    case '$':
      displayValue = formatCurrency(validValue);
      break;
    case '%':
      displayValue = formatPercentage(validValue);
      break;
    case '#':
       displayValue = formatNumber(validValue);
       break;
    default:
      displayValue = formatNumber(validValue);
  }
  
  let displayTarget = '';
   if (validTarget != null && validTarget !== 0) {
       switch (unit) {
            case '$': displayTarget = `Target: ${formatCurrency(validTarget)}`; break;
            case '%': displayTarget = `Target: ${formatPercentage(validTarget)}`; break;
            case '#': displayTarget = `Target: ${formatNumber(validTarget)}`; break;
            default: displayTarget = `Target: ${formatNumber(validTarget)}`;
       }
   }

  return (
    <Card className="p-4 flex flex-col items-center justify-center text-center h-full shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground mb-2 truncate">{label}</h3>
      <svg width="120" height="70" viewBox="0 0 120 70" className="mb-2">
        {/* Background Arc */}
        <path
          d={`M ${60 - radius} 60 A ${radius} ${radius} 0 0 1 ${60 + radius} 60`} // Centered arc
          fill="none"
          stroke="#e5e7eb" // gray-200
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Filled Arc */}
        <motion.path
          d={`M ${60 - radius} 60 A ${radius} ${radius} 0 0 1 ${60 + radius} 60`} // Centered arc
          fill="none"
          stroke="currentColor" // Use text color for the gauge
          strokeWidth="10"
          strokeLinecap="round"
          className="text-primary" // Use primary theme color
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <p className="text-lg font-semibold">{displayValue}</p>
      {displayTarget && <p className="text-xs text-muted-foreground mt-1">{displayTarget}</p>}
    </Card>
  );
} 