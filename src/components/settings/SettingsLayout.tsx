import { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Settings, CreditCard, Users, UserPlus, AlertCircle } from "lucide-react";

interface SettingsLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: ReactNode;
}

export function SettingsLayout({ 
  activeTab, 
  setActiveTab,
  children 
}: SettingsLayoutProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground pl-8">Manage your company and profile settings</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-8 bg-background border-b border-border rounded-none p-0 w-full max-w-4xl">
            <TabsTrigger 
              value="company-details" 
              className={`px-6 py-3 rounded-none transition-all duration-200 flex items-center gap-2 ${activeTab === 'company-details' ? 'border-b-2 border-primary font-medium' : ''}`}
            >
              <Settings className="h-4 w-4" />
              <span>Company Details</span>
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className={`px-6 py-3 rounded-none transition-all duration-200 flex items-center gap-2 ${activeTab === 'billing' ? 'border-b-2 border-primary font-medium' : ''}`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing</span>
            </TabsTrigger>
            <TabsTrigger 
              value="my-investors" 
              className={`px-6 py-3 rounded-none transition-all duration-200 flex items-center gap-2 ${activeTab === 'my-investors' ? 'border-b-2 border-primary font-medium' : ''}`}
            >
              <Users className="h-4 w-4" />
              <span>My Investors</span>
            </TabsTrigger>
            <TabsTrigger 
              value="potential-investors" 
              className={`px-6 py-3 rounded-none transition-all duration-200 flex items-center gap-2 ${activeTab === 'potential-investors' ? 'border-b-2 border-primary font-medium' : ''}`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Potential Investors</span>
            </TabsTrigger>
          </TabsList>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.2
            }}
          >
            <TabsContent value="company-details">
              <motion.div 
                className="grid grid-cols-1 gap-6"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="pt-6">
                    {children}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="billing">
              <Card className="border-2 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Billing Information</h3>
                  </div>
                  
                  <div className="p-10 text-center bg-muted/20 rounded-md border border-dashed">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Billing settings coming soon.</p>
                    <p className="text-xs text-muted-foreground mt-2">Manage your subscription and payment methods</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-investors">
              <Card className="border-2 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">My Investors</h3>
                  </div>
                  
                  <div className="p-10 text-center bg-muted/20 rounded-md border border-dashed">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Investor management coming soon.</p>
                    <p className="text-xs text-muted-foreground mt-2">Track and manage your investors' information</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="potential-investors">
              <Card className="border-2 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Potential Investors</h3>
                  </div>
                  
                  <div className="p-10 text-center bg-muted/20 rounded-md border border-dashed">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Potential investor management coming soon.</p>
                    <p className="text-xs text-muted-foreground mt-2">Manage and track potential investor relationships</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
