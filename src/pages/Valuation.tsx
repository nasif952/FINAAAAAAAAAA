import { ValuationTabs } from '@/components/valuation/ValuationTabs';

export default function Valuation() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-2">CompanyBench</h1>
        <p className="text-muted-foreground">Complete the questionnaire and view your company benchmarks</p>
      </div>
      <ValuationTabs />
    </div>
  );
}
