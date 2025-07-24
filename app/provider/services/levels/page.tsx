
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SelectLevelsPageClient from "@/app/provider/services/levels/SelectLevelsPage";

export default function Page() {
  return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <SelectLevelsPageClient />
      </Suspense>
  );
}
