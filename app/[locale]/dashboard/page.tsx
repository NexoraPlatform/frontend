import DashboardClient from './dashboard-client';
import type {Metadata} from "next";
import {generateSEO} from "@/lib/seo";
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

export const metadata: Metadata = generateSEO({
    title: 'Panou de control',
    description: 'Administrează-ți contul și serviciile',
    url: '/dashboard',
})

export default function DashboardPage() {
  return (
      <>
        <TrustoraThemeStyles />
        <DashboardClient />
      </>
  );
}
