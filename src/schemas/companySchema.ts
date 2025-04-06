
import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  business_activity: z.string().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  total_employees: z.coerce.number().optional(),
  founded_year: z.coerce.number().optional(),
  website_url: z.string().url("Invalid URL").optional().or(z.literal('')),
  country: z.string().optional(),
  currency: z.string().optional(),
  sector: z.string().optional(),
  company_series: z.string().optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
