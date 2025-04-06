
import { useState } from 'react';
import { DefaultMetricsTab } from '@/components/performance/DefaultMetricsTab';
import { PerformanceTab } from '@/components/performance/PerformanceTab';
import { CustomMetricsTab } from '@/components/performance/CustomMetricsTab';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client for this component 
// This ensures performance metrics data is cached properly
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function Performance() {
  const [activeTab, setActiveTab] = useState('update');
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold mb-2">Performance</h1>
          <p className="text-muted-foreground">Track and update your key performance metrics</p>
        </div>
        
        <div className="flex border-b border-border mb-6">
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'update' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('update')}
          >
            Update
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'metrics' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('metrics')}
          >
            Metrics
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'custom' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('custom')}
          >
            Custom
          </button>
        </div>
        
        {activeTab === 'update' && <DefaultMetricsTab />}
        {activeTab === 'metrics' && <PerformanceTab />}
        {activeTab === 'custom' && <CustomMetricsTab />}
      </div>
    </QueryClientProvider>
  );
}
