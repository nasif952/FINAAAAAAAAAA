import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "./components/Layout";
import AuthGuard from "./components/AuthGuard";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Valuation from "./pages/Valuation";
import ValuationDetails from "./pages/ValuationDetails";
import FinancialOverview from "./pages/FinancialOverview";
import Performance from "./pages/Performance";
import CapTable from "./pages/CapTable";
import Data from "./pages/Data";
import NotFound from "./pages/NotFound";
import PitchDeckAnalysis from "./pages/PitchDeckAnalysis";
import DueDiligence from "./pages/DueDiligence";
import InvestorDashboard from "./pages/InvestorDashboard";
import Settings from "./pages/Settings";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Create a query client with global configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds (decrease from 5 minutes)
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: true, // Enable to refresh data when window gains focus
      refetchOnMount: true, // Enable to refresh data when component mounts
      refetchOnReconnect: true, // Enable to refresh data on network reconnection
    },
  },
});

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for and create company data if needed
  useEffect(() => {
    const initializeCompanyData = async () => {
      try {
        // Check if we have any company data
        const { data: existingCompanies, error: checkError } = await supabase
          .from('companies')
          .select('id')
          .limit(1);
          
        if (checkError) {
          console.error("Error checking for existing company:", checkError);
          setIsInitializing(false);
          return;
        }
        
        // If no companies exist, create initial company
        if (!existingCompanies || existingCompanies.length === 0) {
          console.log("No company found, creating initial company record");
          
          const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert([{
              name: 'My Company',
              industry: 'Business Support Services',
              business_activity: 'SaaS',
              founded_year: 2023,
              stage: 'Seed',
              total_employees: 5,
              last_revenue: 12000
            }])
            .select();
            
          if (createError) {
            console.error("Error creating initial company:", createError);
            setIsInitializing(false);
            return;
          }
          
          if (newCompany && newCompany.length > 0) {
            console.log("Created initial company:", newCompany[0]);
            
            // Also create initial valuation record for this company
            const { error: valuationError } = await supabase
              .from('valuations')
              .insert([{
                company_id: newCompany[0].id,
                initial_estimate: 60000,
                selected_valuation: 55000,
                annual_roi: 30
              }]);
              
            if (valuationError) {
              console.error("Error creating initial valuation:", valuationError);
            } else {
              console.log("Created initial valuation record");
            }
          }
        } else {
          console.log("Company data already exists, skipping initialization");
        }
      } catch (err) {
        console.error("Error in company setup:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeCompanyData();
  }, []);
  
  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth/*" element={<Auth />} />
              <Route element={<AuthGuard />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/valuation/*" element={<Valuation />} />
                <Route path="/financial-overview/*" element={<FinancialOverview />} />
                <Route path="/investor-dashboard" element={<Navigate to="/cap-table#investor-dashboard" replace />} />
                <Route path="/cap-table" element={<CapTable />} />
                <Route path="/valuation-details" element={<ValuationDetails />} />
                <Route path="/pitch-deck-analysis" element={<PitchDeckAnalysis />} />
                <Route path="/pitch-deck-analysis/:analysisId" element={<PitchDeckAnalysis />} />
                <Route path="/due-diligence" element={<DueDiligence />} />
                <Route path="/data" element={<Data />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
