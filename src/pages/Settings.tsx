import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { CompanyInfoSection } from "@/components/settings/CompanyInfoSection";
import { AdditionalQuestionsSection } from "@/components/settings/AdditionalQuestionsSection";
import { SocialMediaSection } from "@/components/settings/SocialMediaSection";
import { UsersSection } from "@/components/settings/UsersSection";
import { useSettingsData } from "@/hooks/useSettingsData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Building2, FileText, Share2, Users } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("company-details");
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile-details");
  const { toast } = useToast();
  
  const {
    companyData,
    profileData,
    questionsData,
    socialMediaData,
    appUsersData
  } = useSettingsData();
  
  // Check if company data exists, if not create initial company
  useEffect(() => {
    const setupInitialCompany = async () => {
      try {
        // Check if we have any company data
        const { data: existingCompanies, error: checkError } = await supabase
          .from('companies')
          .select('id')
          .limit(1);
          
        if (checkError) {
          console.error("Error checking for existing company:", checkError);
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
            toast({
              title: "Error",
              description: "Could not create initial company record.",
              variant: "destructive"
            });
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
              toast({
                title: "Company Created",
                description: "Initial company record created successfully.",
              });
              
              // Reload the page to load the new company data
              window.location.reload();
            }
          }
        }
      } catch (err) {
        console.error("Error in company setup:", err);
      }
    };
    
    setupInitialCompany();
  }, [toast]);

  // Animation variants for tab switching
  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.2 
      }
    }
  };

  // Content for each tab with its icon
  const tabContents = [
    { 
      id: "profile-details", 
      label: "Profile Details", 
      icon: <UserCircle className="h-4 w-4" />,
      content: <ProfileSection profileData={profileData} />
    },
    { 
      id: "company-info", 
      label: "Company Info", 
      icon: <Building2 className="h-4 w-4" />,
      content: <CompanyInfoSection companyData={companyData} />
    },
    { 
      id: "additional-questions", 
      label: "Additional Questions", 
      icon: <FileText className="h-4 w-4" />,
      content: <AdditionalQuestionsSection questionsData={questionsData} companyData={companyData} />
    },
    { 
      id: "social-media", 
      label: "Social Media", 
      icon: <Share2 className="h-4 w-4" />,
      content: <SocialMediaSection socialMediaData={socialMediaData} companyData={companyData} />
    },
    { 
      id: "users", 
      label: "Users", 
      icon: <Users className="h-4 w-4" />,
      content: <UsersSection appUsersData={appUsersData} />
    }
  ];

  return (
    <SettingsLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Tabs 
        value={activeSettingsTab} 
        onValueChange={setActiveSettingsTab}
        className="w-full"
      >
        <TabsList className="mb-8 border-b pb-0 overflow-x-auto">
          {tabContents.map(tab => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className={`flex items-center gap-2 px-5 py-3 ${activeSettingsTab === tab.id ? 'border-b-2 border-primary bg-muted/20' : ''} transition-all duration-300 rounded-none`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          {tabContents.map(tab => (
            activeSettingsTab === tab.id && (
              <motion.div
                key={tab.id}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabVariants}
              >
                <TabsContent value={tab.id} forceMount className="outline-none">
                  {tab.content}
                </TabsContent>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </Tabs>
    </SettingsLayout>
  );
}
