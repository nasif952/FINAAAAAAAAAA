import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { extendedSupabase } from "@/integrations/supabase/client-extension";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/integrations/supabase/client-extension";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save, CheckCircle2 } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  last_name: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  country_code: z.string().optional(),
});

interface ProfileSectionProps {
  profileData: Profile | null;
}

export function ProfileSection({ profileData }: ProfileSectionProps) {
  const { toast } = useToast();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      last_name: "",
      designation: "",
      phone: "",
      country_code: "",
    },
  });

  useEffect(() => {
    if (profileData) {
      profileForm.reset({
        full_name: profileData.full_name || "",
        last_name: profileData.last_name || "",
        designation: profileData.designation || "",
        phone: profileData.phone || "",
        country_code: profileData.country_code || "",
      });
    }
  }, [profileData, profileForm]);

  const updateProfile = useMutation({
    mutationFn: async (values: any) => {
      if (!profileData?.id) throw new Error("Profile not found");
      
      const { error } = await extendedSupabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          last_name: values.last_name,
          designation: values.designation,
          phone: values.phone,
          country_code: values.country_code,
        })
        .eq('id', profileData.id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (values: any) => {
    updateProfile.mutate(values);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
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

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.03 },
    tap: { scale: 0.98 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center mb-6 border-b pb-4"
        variants={itemVariants}
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Personal Information</h2>
          <p className="text-sm text-muted-foreground">Update your personal profile details</p>
        </div>
      </motion.div>

      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-8">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
            variants={itemVariants}
          >
            <motion.div variants={itemVariants}>
              <FormField
                control={profileForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className="transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/20" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                control={profileForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Doe" 
                        {...field} 
                        className="transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                control={profileForm.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Designation</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="CEO" 
                        {...field} 
                        className="transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1234567890" 
                        {...field} 
                        className="transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                control={profileForm.control}
                name="country_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Country Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="US" 
                        {...field} 
                        className="transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          </motion.div>

          <motion.div 
            className="flex justify-end"
            variants={itemVariants}
          >
            <motion.div
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Button 
                type="submit" 
                className={`gap-2 px-6 ${updateProfile.isPending ? 'opacity-90' : ''}`}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 rounded-full border-2 border-background border-r-transparent" />
                    <span>Updating...</span>
                  </>
                ) : updateProfile.isSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Updated</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update Profile</span>
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  );
}
