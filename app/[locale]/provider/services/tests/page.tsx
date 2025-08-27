import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SelectTestsPageClient from "@/app/[locale]/provider/services/tests/SelectTestsPageClient";

export default function Page() {
  return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <SelectTestsPageClient />
      </Suspense>
  );
}
