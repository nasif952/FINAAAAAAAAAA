
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { extendedSupabase } from "@/integrations/supabase/client-extension";
import { useToast } from "@/hooks/use-toast";
import { SocialMedia, Company } from "@/integrations/supabase/client-extension";
import { useEffect } from "react";
import { Linkedin, Instagram, Twitter } from "lucide-react";

const socialMediaSchema = z.object({
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
  instagram: z.string().url("Invalid Instagram URL").optional().or(z.literal('')),
  crunchbase: z.string().url("Invalid Crunchbase URL").optional().or(z.literal('')),
  twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal('')),
});

interface SocialMediaSectionProps {
  socialMediaData: SocialMedia | null;
  companyData: Company | null;
}

export function SocialMediaSection({ socialMediaData, companyData }: SocialMediaSectionProps) {
  const { toast } = useToast();

  const socialMediaForm = useForm({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      linkedin: "",
      instagram: "",
      crunchbase: "",
      twitter: "",
    },
  });

  useEffect(() => {
    if (socialMediaData) {
      socialMediaForm.reset({
        linkedin: socialMediaData.linkedin || "",
        instagram: socialMediaData.instagram || "",
        crunchbase: socialMediaData.crunchbase || "",
        twitter: socialMediaData.twitter || "",
      });
    }
  }, [socialMediaData, socialMediaForm]);

  const updateSocialMedia = useMutation({
    mutationFn: async (values: any) => {
      if (!companyData?.id) throw new Error("Company not found");
      
      if (socialMediaData?.id) {
        // Update existing record
        const { error } = await extendedSupabase
          .from('social_media')
          .update({
            linkedin: values.linkedin,
            instagram: values.instagram,
            crunchbase: values.crunchbase,
            twitter: values.twitter,
          })
          .eq('id', socialMediaData.id);
        
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await extendedSupabase
          .from('social_media')
          .insert({
            company_id: companyData.id,
            linkedin: values.linkedin,
            instagram: values.instagram,
            crunchbase: values.crunchbase,
            twitter: values.twitter,
          });
        
        if (error) throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Social media updated",
        description: "Your social media links have been updated successfully."
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
    updateSocialMedia.mutate(values);
  };

  return (
    <Form {...socialMediaForm}>
      <form onSubmit={socialMediaForm.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={socialMediaForm.control}
            name="linkedin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/company/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={socialMediaForm.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://instagram.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={socialMediaForm.control}
            name="twitter"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://twitter.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={socialMediaForm.control}
            name="crunchbase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crunchbase</FormLabel>
                <FormControl>
                  <Input placeholder="https://crunchbase.com/organization/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="mt-6"
          disabled={updateSocialMedia.isPending}
        >
          {updateSocialMedia.isPending ? "Updating..." : "Update Social Media Links"}
        </Button>
      </form>
    </Form>
  );
}
