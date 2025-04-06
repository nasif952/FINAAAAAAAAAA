import { useState, useEffect } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { QuestionnaireContent } from '@/pages/valuation/QuestionnaireContent';
import { BenchmarksContent } from '@/pages/valuation/BenchmarksContent';
import { SmartAssessment } from '@/pages/valuation/SmartAssessment';
import { DataVisualization } from '@/pages/valuation/DataVisualization';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart4, ListChecks, Target, BrainCircuit } from 'lucide-react';

export function ValuationTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('questionnaire');
  
  // Handle tab from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['questionnaire', 'benchmarks', 'visualization', 'assessment'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/valuation?tab=${value}`, { replace: true });
  };

  // Define tabs configuration
  const tabs = [
    {
      id: 'questionnaire',
      label: 'Questionnaire',
      icon: <ListChecks size={16} className="mr-2" />,
      component: <QuestionnaireContent setActiveTab={setActiveTab} />
    },
    {
      id: 'benchmarks',
      label: 'Benchmarks',
      icon: <Target size={16} className="mr-2" />,
      component: <BenchmarksContent />
    },
    {
      id: 'visualization',
      label: 'Visuals',
      icon: <BarChart4 size={16} className="mr-2" />,
      component: <DataVisualization />
    },
    {
      id: 'assessment',
      label: 'AI Assessment',
      icon: <BrainCircuit size={16} className="mr-2" />,
      component: <SmartAssessment />
    }
  ];

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="w-full max-w-fit mb-6 bg-background border-b border-border rounded-none p-0 overflow-x-auto">
        {tabs.map(tab => (
          <TabsTrigger 
            key={tab.id}
            value={tab.id} 
            className={`px-6 py-3 rounded-none flex items-center transition-all duration-200 ${activeTab === tab.id ? 'border-b-2 border-primary font-medium text-primary' : 'text-muted-foreground'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id}>
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}
