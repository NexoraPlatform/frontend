
import {Metadata} from "next";
import {generateSEO} from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: 'FAQ - Întrebări Frecvente',
  description: 'Ai o intrebare? Verifica sectiunea de întrebări frecvente pentru răspunsuri rapide la cele mai comune întrebări despre Nexora.',
  url: '/help',
})

export default function HelpPage() {
  return <HelpPage />;
}
