import { useState, useEffect } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { ValuationContent } from '@/pages/valuation/ValuationContent';
import { HistoryContent } from '@/pages/valuation/HistoryContent';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { BarChart3 } from 'lucide-react';

export default function ValuationDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('valE');
  
  // Handle tab from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['valE', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/valuation-details?tab=${value}`, { replace: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold mb-2">Valuation</h1>
        
        
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full max-w-md mb-6 bg-background border-b border-border rounded-none p-0">
          <TabsTrigger 
            value="valE" 
            className={`px-6 py-3 rounded-none ${activeTab === 'valE' ? 'border-b-2 border-primary' : ''}`}
          >
            ValE
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className={`px-6 py-3 rounded-none ${activeTab === 'history' ? 'border-b-2 border-primary' : ''}`}
          >
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="valE">
          <ValuationContent />
        </TabsContent>
        <TabsContent value="history">
          <HistoryContent />
        </TabsContent>
      </Tabs>
    </div>
  );
} 