import {Metadata} from "next";
import {generateSEO} from "@/lib/seo";
import HelpPageComponent from "@/app/help/help-page";
import {
  BookOpen, CheckCircle,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  Video
} from "lucide-react";
import { Footer } from "@/components/footer";
import { Header } from '@/components/header';


export const metadata: Metadata = generateSEO({
  title: 'FAQ - Întrebări Frecvente',
  description: 'Ai o intrebare? Verifica sectiunea de întrebări frecvente pentru răspunsuri rapide la cele mai comune întrebări despre Nexora.',
  url: '/help',
})

export default function HelpPage() {
  const faqCategories = [
    {
      id: 'general',
      title: 'Întrebări Generale',
      icon: HelpCircle,
      faqs: [
        {
          question: 'Ce este Nexora și cum funcționează?',
          answer: 'Nexora este o platformă românească care conectează clienții cu experți IT verificați. Poți căuta servicii, compara oferte, și colabora direct cu furnizorii prin platforma noastră securizată.'
        },
        {
          question: 'Este gratuit să folosesc Nexora?',
          answer: 'Da, înregistrarea și căutarea serviciilor sunt complet gratuite. Plătești doar pentru serviciile pe care le comanzi, fără taxe ascunse.'
        },
        {
          question: 'Cum sunt verificați experții de pe platformă?',
          answer: 'Toți furnizorii trec printr-un proces riguros de verificare care include validarea identității, portofoliului, referințelor și competențelor tehnice.'
        },
        {
          question: 'În cât timp primesc oferte pentru proiectul meu?',
          answer: 'De obicei, primești primele oferte în câteva ore după publicarea proiectului. Majoritatea clienților primesc 3-5 oferte în prima zi.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Plăți și Facturare',
      icon: CreditCard,
      faqs: [
        {
          question: 'Ce metode de plată acceptați?',
          answer: 'Acceptăm carduri de credit/debit (Visa, Mastercard), transfer bancar, și plăți prin PayPal. Toate tranzacțiile sunt securizate SSL.'
        },
        {
          question: 'Când se efectuează plata către furnizor?',
          answer: 'Plata se face în etape (milestones) stabilite în contract. Banii sunt eliberați către furnizor doar după confirmarea ta că etapa a fost finalizată satisfăcător.'
        },
        {
          question: 'Pot primi factură pentru serviciile comandate?',
          answer: 'Da, toți furnizorii înregistrați ca PFA sau SRL pot emite facturi. Specifică această cerință când postezi proiectul.'
        },
        {
          question: 'Ce se întâmplă dacă nu sunt mulțumit de rezultat?',
          answer: 'Avem o politică de protecție a clientului. Dacă serviciul nu corespunde specificațiilor, poți solicita revizuiri gratuite sau rambursarea banilor.'
        }
      ]
    },
    {
      id: 'projects',
      title: 'Gestionarea Proiectelor',
      icon: FileText,
      faqs: [
        {
          question: 'Cum postez un proiect nou?',
          answer: 'Apasă pe "Postează Proiect", completează detaliile (descriere, buget, deadline), și publică. Vei primi oferte de la experți interesați în câteva ore.'
        },
        {
          question: 'Pot modifica proiectul după ce l-am publicat?',
          answer: 'Da, poți edita descrierea, bugetul și alte detalii până când accepți o ofertă. După aceea, modificările se fac prin acordul ambelor părți.'
        },
        {
          question: 'Cum comunic cu furnizorii?',
          answer: 'Toată comunicarea se face prin sistemul de mesagerie integrat al platformei, care păstrează istoricul conversațiilor și fișierelor partajate.'
        },
        {
          question: 'Pot lucra cu același furnizor pentru mai multe proiecte?',
          answer: 'Absolut! Poți invita direct furnizorii cu care ai colaborat anterior la proiecte noi, fără să mai postezi public.'
        }
      ]
    },
    {
      id: 'security',
      title: 'Siguranță și Confidențialitate',
      icon: Shield,
      faqs: [
        {
          question: 'Cât de sigure sunt datele mele pe platformă?',
          answer: 'Folosim criptare SSL de nivel bancar și respectăm GDPR. Datele tale sunt stocate securizat și nu sunt partajate cu terțe părți fără acordul tău.'
        },
        {
          question: 'Cum protejez proprietatea intelectuală a proiectului?',
          answer: 'Recomandăm semnarea unui NDA (acord de confidențialitate) înainte de a împărtăși detalii sensibile. Oferim template-uri gratuite.'
        },
        {
          question: 'Ce fac dacă suspectez o activitate frauduloasă?',
          answer: 'Raportează imediat echipei noastre prin sistemul de raportare. Investigăm toate cazurile în 24 de ore și luăm măsuri corespunzătoare.'
        }
      ]
    }
  ];

  const supportOptions = [
    {
      title: 'Chat Live',
      description: 'Vorbește direct cu echipa noastră de suport',
      icon: MessageCircle,
      availability: 'Luni-Vineri, 9:00-18:00',
      action: 'Începe Chat',
      primary: true
    },
    {
      title: 'Suport Telefonic',
      description: 'Sună-ne pentru asistență imediată',
      icon: Phone,
      availability: '+40 123 456 789',
      action: 'Sună Acum',
      primary: false
    },
    {
      title: 'Email Support',
      description: 'Trimite-ne un email detaliat',
      icon: Mail,
      availability: 'Răspuns în 2-4 ore',
      action: 'Trimite Email',
      primary: false
    }
  ];

  const resources = [
    {
      title: 'Ghid pentru Începători',
      description: 'Învață să folosești Nexora pas cu pas',
      icon: BookOpen,
      type: 'PDF Guide',
      link: '#'
    },
    {
      title: 'Video Tutorials',
      description: 'Tutoriale video pentru toate funcționalitățile',
      icon: Video,
      type: 'Video Series',
      link: '#'
    },
    {
      title: 'Template-uri de Contracte',
      description: 'Modele de contracte și NDA-uri',
      icon: Download,
      type: 'Downloads',
      link: '#'
    },
    {
      title: 'Best Practices',
      description: 'Sfaturi pentru proiecte de succes',
      icon: CheckCircle,
      type: 'Article',
      link: '#'
    }
  ];

  return (
      <div className="min-h-screen bg-background">
        <Header />
        <HelpPageComponent
            faqCategories={faqCategories}
            supportOptions={supportOptions}
            resources={resources}
        />
        <Footer />
      </div>
      );
}
