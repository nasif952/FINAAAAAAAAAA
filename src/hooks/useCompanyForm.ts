
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { extendedSupabase } from "@/integrations/supabase/client-extension";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/integrations/supabase/client-extension";
import { useEffect } from "react";
import { companySchema, CompanyFormValues } from "@/schemas/companySchema";

export function useCompanyForm(companyData: Company | null) {
  const { toast } = useToast();

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      business_activity: "",
      industry: "",
      stage: "",
      total_employees: 0,
      founded_year: 0,
      website_url: "",
      country: "",
      currency: "",
      sector: "",
      company_series: "",
    },
  });

  useEffect(() => {
    if (companyData) {
      companyForm.reset({
        name: companyData.name || "",
        business_activity: companyData.business_activity || "",
        industry: companyData.industry || "",
        stage: companyData.stage || "",
        total_employees: companyData.total_employees || 0,
        founded_year: companyData.founded_year || 0,
        website_url: companyData.website_url || "",
        country: companyData.country || "",
        currency: companyData.currency || "",
        sector: companyData.sector || "",
        company_series: companyData.company_series || "",
      });
    }
  }, [companyData, companyForm]);

  const updateCompany = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      if (!companyData?.id) throw new Error("Company not found");
      
      const { error } = await extendedSupabase
        .from('companies')
        .update({
          name: values.name,
          business_activity: values.business_activity,
          industry: values.industry,
          stage: values.stage,
          total_employees: values.total_employees,
          founded_year: values.founded_year,
          website_url: values.website_url,
          country: values.country,
          currency: values.currency,
          sector: values.sector,
          company_series: values.company_series,
        })
        .eq('id', companyData.id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Company updated",
        description: "Your company information has been updated successfully."
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

  const onSubmit = (values: CompanyFormValues) => {
    updateCompany.mutate(values);
  };

  return {
    form: companyForm,
    onSubmit,
    isUpdating: updateCompany.isPending
  };
}
