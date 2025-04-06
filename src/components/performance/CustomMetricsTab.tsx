import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MetricInfoCard } from './MetricInfoCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomMetric {
  id: string;
  title: string;
  description: string;
  unit: string;
  category: string;
}

export function CustomMetricsTab() {
  const { toast } = useToast();
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false);
  const [newMetric, setNewMetric] = useState<Partial<CustomMetric>>({
    title: '',
    description: '',
    unit: '',
    category: 'Financial Transactions & KPIs'
  });
  
  const categories = [
    'Financial Transactions & KPIs',
    'Sales Traction & KPIs',
    'Marketing Traction & KPIs'
  ];
  
  const [customMetrics, setCustomMetrics] = useState<CustomMetric[]>([]);
  
  const handleAddCustomMetric = () => {
    setIsAddMetricOpen(true);
    setNewMetric({
        title: '',
        description: '',
        unit: '',
        category: categories[0]
      });
  };
  
  const submitNewMetric = () => {
    if (newMetric.title && newMetric.description && newMetric.unit && newMetric.category) {
      const newMetricObj = {
        id: Date.now().toString(),
        title: newMetric.title,
        description: newMetric.description,
        unit: newMetric.unit,
        category: newMetric.category
      };
      
      setCustomMetrics(prev => [...prev, newMetricObj]);
      
      setIsAddMetricOpen(false);
      toast({ title: "Custom Metric Added", description: `"${newMetric.title}" added.` });

    } else {
      toast({
        title: "Error",
        description: "Please fill in all fields to add a custom metric.",
        variant: "destructive"
      });
    }
  };
  
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
    exit: { scale: 0.9, opacity: 0 },
    hover: { scale: 1.03, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-xl font-semibold">Metric Definitions</h2>
        <Button 
          size="sm" 
          onClick={handleAddCustomMetric}
        >
          <Plus size={16} className="mr-1" /> Add Custom Metric
        </Button>
      </div>
      
      {categories.map((category, catIndex) => (
         <motion.section 
           key={category} 
           className="mb-8"
           initial="hidden" 
           animate="visible" 
           variants={listVariants}
         >
           <h3 className="text-lg font-semibold text-primary mb-4">{`${catIndex + 1}. ${category}`}</h3>
           
           <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={listVariants}
            >
            {category === 'Financial Transactions & KPIs' && [
                { title:"Revenue", description:"Revenue is the income generated from normal business operations", unit:"Currency" },
                { title:"MRR - Monthly Recurring Revenue", description:"Average Revenue per Account (Monthly) * Total # of Customers", unit:"Currency" },
                { title:"Revenue Growth", description:"[(Revenue this month - Revenue Last Month)/Revenue Last Month] * 100", unit:"Percentage" },
                { title:"Cost of Sales", description:"All costs used to create a product or service, which has been sold", unit:"Currency" },
                { title:"Gross Margin", description:"[(Total Revenue - Cost of Goods Sold)/Total Revenue] * 100", unit:"Percentage" },
                { title:"EBIT", description:"Revenue - COGS - Operating Expenses", unit:"Currency" },
                { title:"Net Profit", description:"Revenue - COGS - Operating Expenses - Interest - Tax", unit:"Currency" },
                { title:"Burn Rate", description:"Cash payments - cash collections", unit:"Currency" },
            ].map(metric => (
               <motion.div key={metric.title} variants={itemVariants} whileHover="hover"> 
                 <MetricInfoCard {...metric} />
               </motion.div>
            ))}
            
             {category === 'Sales Traction & KPIs' && [
                 { title:"Runway", description:"Cash Balance / Monthly Burn Rate", unit:"Months" },
                 { title:"Cash on Hand", description:"Refer to actual cash in a company", unit:"Currency" },
                 { title:"No of Paying Customers", description:"A customer who buys something", unit:"Numbers" },
                 { title:"Customer Cost Acquisition (CAC)", description:"Total Sales and Marketing Expenses/New Customer Acquired", unit:"Currency" },
             ].map(metric => (
                <motion.div key={metric.title} variants={itemVariants} whileHover="hover"> 
                  <MetricInfoCard {...metric} />
                </motion.div>
             ))}

            {category === 'Marketing Traction & KPIs' && [
                 { title:"Retention Rate", description:"[Ending Customers - New Customers] * Beginning Customers-1 - Churn Rate (%)", unit:"Percentage" },
                 { title:"Churn Rate", description:"Total Customers churned in this time period/Total customers at the start of this time period * 100", unit:"Percentage" },
            ].map(metric => (
                 <motion.div key={metric.title} variants={itemVariants} whileHover="hover"> 
                   <MetricInfoCard {...metric} />
                 </motion.div>
             ))}
             
             <AnimatePresence>
                 {customMetrics
                   .filter(metric => metric.category === category)
                   .map(metric => (
                     <motion.div 
                       key={metric.id} 
                       variants={itemVariants} 
                       initial="hidden" 
                       animate="visible" 
                       exit="exit" 
                       layout
                       whileHover="hover"
                       className="relative group"
                     >
                       <MetricInfoCard 
                         title={metric.title} 
                         description={metric.description} 
                         unit={metric.unit}
                       />
                     </motion.div>
                   ))
                 }
             </AnimatePresence>
            </motion.div>
         </motion.section>
      ))}
      
      <Dialog open={isAddMetricOpen} onOpenChange={setIsAddMetricOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Metric</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="metric-title" className="text-right">Title</Label>
               <Input id="metric-title" value={newMetric.title} onChange={(e) => setNewMetric({...newMetric, title: e.target.value})} className="col-span-3" placeholder="e.g., Customer Lifetime Value"/>
             </div>
              <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="metric-description" className="text-right">Description</Label>
               <Textarea id="metric-description" value={newMetric.description} onChange={(e) => setNewMetric({...newMetric, description: e.target.value})} className="col-span-3" placeholder="How calculated or what it means"/>
             </div>
              <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="metric-unit" className="text-right">Unit</Label>
               <Input id="metric-unit" value={newMetric.unit} onChange={(e) => setNewMetric({...newMetric, unit: e.target.value})} className="col-span-3" placeholder="e.g., $, %, #, Months"/>
             </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="metric-category" className="text-right">Category</Label>
                 <Select 
                    value={newMetric.category} 
                    onValueChange={(value) => setNewMetric({...newMetric, category: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
             </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddMetricOpen(false)}>Cancel</Button>
            <Button type="button" onClick={submitNewMetric}>Add Metric</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
