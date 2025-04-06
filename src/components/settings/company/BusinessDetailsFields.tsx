
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { CompanyFormValues } from "@/schemas/companySchema";

interface BusinessDetailsFieldsProps {
  control: Control<CompanyFormValues>;
}

export function BusinessDetailsFields({ control }: BusinessDetailsFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="stage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Stage</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                <SelectItem value="Seed">Seed</SelectItem>
                <SelectItem value="Series A">Series A</SelectItem>
                <SelectItem value="Series B">Series B</SelectItem>
                <SelectItem value="Growth">Growth</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="total_employees"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Total Employees</FormLabel>
            <FormControl>
              <Input type="number" placeholder="10" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="founded_year"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Founded Year</FormLabel>
            <FormControl>
              <Input type="number" placeholder="2020" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
