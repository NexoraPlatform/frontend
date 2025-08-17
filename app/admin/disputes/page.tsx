"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminDisputesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Gestionare Dispute</h1>
          <p className="text-muted-foreground">
            Rezolvă disputele între utilizatori
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Lista Dispute</span>
          </CardTitle>
          <CardDescription>
            Toate disputele și reclamațiile platformei
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nu există dispute active</h3>
            <p className="text-muted-foreground">
              Toate disputele au fost rezolvate cu succes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
