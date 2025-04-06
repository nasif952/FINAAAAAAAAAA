
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Company } from "@/integrations/supabase/client-extension";
import { useCompanyForm } from "@/hooks/useCompanyForm";
import { BasicInfoFields } from "./company/BasicInfoFields";
import { BusinessDetailsFields } from "./company/BusinessDetailsFields";
import { AdditionalInfoFields } from "./company/AdditionalInfoFields";

interface CompanyInfoSectionProps {
  companyData: Company | null;
}

export function CompanyInfoSection({ companyData }: CompanyInfoSectionProps) {
  const { form, onSubmit, isUpdating } = useCompanyForm(companyData);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BasicInfoFields control={form.control} />
          <BusinessDetailsFields control={form.control} />
          <AdditionalInfoFields control={form.control} />
        </div>

        <Button 
          type="submit" 
          className="mt-6"
          disabled={isUpdating}
        >
          {isUpdating ? "Updating..." : "Update Company Details"}
        </Button>
      </form>
    </Form>
  );
}
