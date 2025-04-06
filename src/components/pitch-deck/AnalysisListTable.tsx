import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Calendar, Star } from 'lucide-react';

interface Analysis {
  id: string;
  title: string;
  status: string;
  upload_date: string;
  overall_score: number | null;
}

interface AnalysisListTableProps {
  analyses: Analysis[];
}

export function AnalysisListTable({ analyses }: AnalysisListTableProps) {
  const navigate = useNavigate();
  
  const columns = [
    {
      key: 'title',
      header: 'Title',
      className: 'w-1/3',
      render: (value: string) => (
        <div className="flex items-center group">
          <div className="p-1.5 rounded-md bg-primary/5 mr-2 group-hover:bg-primary/10 transition-colors duration-200">
            <FileText className="h-4 w-4 text-primary/80" />
          </div>
          <span className="font-medium group-hover:text-primary transition-colors duration-200">{value}</span>
        </div>
      ),
    },
    {
      key: 'upload_date',
      header: 'Date',
      className: 'w-1/6',
      render: (value: string) => (
        <div className="flex items-center text-muted-foreground">
          <Calendar className="mr-1.5 h-3.5 w-3.5" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-1/6',
      render: (value: string) => {
        let variant: 'default' | 'outline' | 'destructive' | 'secondary' = 'default';
        let label = 'Unknown';
        
        switch (value) {
          case 'completed':
            variant = 'default';
            label = 'Completed';
            break;
          case 'processing':
            variant = 'secondary';
            label = 'Processing';
            break;
          case 'pending':
            variant = 'outline';
            label = 'Pending';
            break;
          case 'failed':
            variant = 'destructive';
            label = 'Failed';
            break;
        }
        
        return (
          <Badge variant={variant} className="font-medium">
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'overall_score',
      header: 'Score',
      className: 'w-1/6',
      render: (value: number | null) => {
        if (value === null) return <span className="text-muted-foreground">N/A</span>;
        
        let textColor = 'text-red-500';
        if (value >= 7) textColor = 'text-green-500';
        else if (value >= 5) textColor = 'text-amber-500';
        
        return (
          <div className="flex items-center">
            <Star className={`h-4 w-4 mr-1 ${textColor}`} />
            <span className={`font-semibold ${textColor}`}>
              {value}/10
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-1/6 text-right',
      render: (_: any, item: Analysis) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(`/pitch-deck-analysis/${item.id}`)}
          disabled={item.status !== 'completed'}
          className="group hover:bg-primary/5"
        >
          <span className="mr-2">View</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
      ),
    },
  ];

  return (
    <div className="py-3">
      <DataTable 
        columns={columns} 
        data={analyses} 
        emptyState="No analyses found"
        exportFilename="pitch-deck-analyses"
      />
    </div>
  );
}
