import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";

interface Column {
  key: string;
  header: ReactNode;
  className?: string;
  render?: (value: any, item: any) => ReactNode;
  // This is for export to ensure we get proper data
  export?: (value: any, item: any) => string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  className?: string;
  emptyState?: ReactNode;
  exportFilename?: string;
}

export function DataTable({ columns, data, className, emptyState, exportFilename = 'exported-data' }: DataTableProps) {
  // Function to export data to Excel (CSV format)
  const exportToExcel = () => {
    if (!data || data.length === 0) return;

    // Create CSV content
    const headers = columns.map(col => `"${col.header}"`).join(',');
    
    const rows = data.map(item => {
      return columns.map(column => {
        // Use export function if provided, otherwise use render or raw value
        let cellValue;
        
        if (column.export) {
          cellValue = column.export(item[column.key], item);
        } else if (column.render && typeof column.render(item[column.key], item) !== 'object') {
          // Only use render if it doesn't return React elements
          cellValue = column.render(item[column.key], item);
        } else {
          cellValue = item[column.key];
        }
        
        // Escape quotes and ensure string format
        if (cellValue === null || cellValue === undefined) {
          return '""';
        }
        
        if (typeof cellValue === 'string') {
          return `"${cellValue.replace(/"/g, '""')}"`;
        }
        
        return `"${String(cellValue)}"`;
      }).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFilename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("w-full overflow-auto", className)}>
      {data?.length > 0 && (
        <div className="flex justify-end mb-2">
          <button 
            onClick={exportToExcel}
            className="text-sm flex items-center gap-1 text-primary px-2 py-1 rounded hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export as CSV
          </button>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, i) => (
              <TableHead
                key={i}
                className={cn(column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className={cn(column.className)}
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center h-24"
              >
                {emptyState || "No data available"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
