"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Locale } from '@/types/locale';
import { useAsyncTranslation } from '@/hooks/use-async-translation';

export default function AdminDisputesPage() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';

  const manageTitle = useAsyncTranslation(locale, 'admin.disputes.manage_title');
  const manageSubtitle = useAsyncTranslation(locale, 'admin.disputes.manage_subtitle');
  const listTitle = useAsyncTranslation(locale, 'admin.disputes.list_title');
  const listDescription = useAsyncTranslation(locale, 'admin.disputes.list_description');
  const emptyTitle = useAsyncTranslation(locale, 'admin.disputes.empty_title');
  const emptyDescription = useAsyncTranslation(locale, 'admin.disputes.empty_description');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{manageTitle}</h1>
          <p className="text-muted-foreground">{manageSubtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>{listTitle}</span>
          </CardTitle>
          <CardDescription>{listDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{emptyTitle}</h3>
            <p className="text-muted-foreground">{emptyDescription}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
