"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Locale } from '@/types/locale';
import { useAsyncTranslation } from '@/hooks/use-async-translation';

export default function AdminAnalyticsPage() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';

  const title = useAsyncTranslation(locale, 'admin.analytics.manage_title');
  const subtitle = useAsyncTranslation(locale, 'admin.analytics.manage_subtitle');
  const statsTitle = useAsyncTranslation(locale, 'admin.analytics.stats_title');
  const statsDescription = useAsyncTranslation(locale, 'admin.analytics.stats_description');
  const developmentTitle = useAsyncTranslation(locale, 'admin.analytics.in_development_title');
  const developmentDescription = useAsyncTranslation(locale, 'admin.analytics.in_development_description');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>{statsTitle}</span>
          </CardTitle>
          <CardDescription>{statsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{developmentTitle}</h3>
            <p className="text-muted-foreground">{developmentDescription}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
