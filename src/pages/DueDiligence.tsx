
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Square, 
  AlertCircle 
} from 'lucide-react';

export default function DueDiligence() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-2">Due Diligence Checklist</h1>
        <p className="text-muted-foreground">Track and manage your due diligence process</p>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-muted-foreground">
          The due diligence checklist feature is currently in development and will be available soon.
        </p>
      </Card>
    </div>
  );
}
