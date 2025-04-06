
import { Card } from '@/components/Card';
import { useState } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricInfoCardProps {
  title: string;
  description: string;
  unit: string;
}

export function MetricInfoCard({ title, description, unit }: MetricInfoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`transition-all duration-200`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`p-4 ${isHovered ? 'shadow-md' : ''}`}>
        <div className="flex items-start justify-between">
          <h4 className="font-medium mb-2">{title}</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground hover:text-primary cursor-help">
                  <Info size={16} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="max-w-xs text-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        <p className="text-xs text-primary font-medium">{unit}</p>
      </Card>
    </div>
  );
}
