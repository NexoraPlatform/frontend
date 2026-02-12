import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SelectTestsPageClient from "@/app/[locale]/provider/services/tests/SelectTestsPageClient";

export default function Page() {
  return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)] dark:bg-[#070C14]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <SelectTestsPageClient />
      </Suspense>
  );
}
