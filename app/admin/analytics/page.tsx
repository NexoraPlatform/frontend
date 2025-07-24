"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowLeft } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Analytics & Rapoarte</h1>
          <p className="text-muted-foreground">
            Analizează performanța platformei
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Statistici Detaliate</span>
          </CardTitle>
          <CardDescription>
            Rapoarte și analize pentru platforma Nexora
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Analytics în dezvoltare</h3>
            <p className="text-muted-foreground">
              Rapoartele detaliate vor fi disponibile în curând
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}