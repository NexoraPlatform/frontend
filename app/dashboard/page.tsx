import DashboardClient from './dashboard-client';
import {Metadata} from "next";
import {generateSEO} from "@/lib/seo";

export const metadata: Metadata = generateSEO({
    title: 'Panou de control',
    description: 'Administrează-ți contul și serviciile',
    url: '/dashboard',
})

export default function DashboardPage() {
  return (
      <>
        <DashboardClient />
      </>
  );
}
