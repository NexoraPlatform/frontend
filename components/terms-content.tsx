import { cn } from "@/lib/utils";

type TermsContentProps = {
  className?: string;
  headingClassName?: string;
  locale?: string;
};

function TermsContentRo({ className, headingClassName }: Omit<TermsContentProps, "locale">) {
  return (
    <div className={cn("space-y-6 text-sm text-slate-600 dark:text-slate-300", className)}>
      <div className="space-y-1">
        <h2 className={cn("text-xl font-semibold text-slate-900 dark:text-white", headingClassName)}>
          TERMENI ȘI CONDIȚII DE UTILIZARE – TRUSTORA
        </h2>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Ultima actualizare: 17 ianuarie 2026
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">1. PREAMBUL ȘI ACCEPTARE</h3>
        <p>
          Bine ați venit pe Trustora (&quot;Platforma&quot;, &quot;Noi&quot;, &quot;Compania&quot;). Trustora este o
          infrastructură digitală care facilitează colaborarea, contractarea și plățile securizate între Companii
          (&quot;Clienți&quot;) și Profesioniști independenți sau Agenții (&quot;Furnizori&quot; sau &quot;Provideri&quot;).
        </p>
        <p>
          Accesând sau utilizând site-ul nostru (trustora.ro / trustora.com) și serviciile asociate, sunteți de acord să
          respectați acești Termeni și Condiții (&quot;Termenii&quot;). Dacă nu sunteți de acord, vă rugăm să nu utilizați
          Platforma.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">2. DEFINIȚII</h3>
        <p>Pentru claritate, termenii de mai jos au următorul înțeles:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Cont:</span> Profilul înregistrat pe Platformă
            (Client sau Furnizor).
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Client:</span> Persoana juridică sau fizică
            autorizată care inițiază un Proiect și plătește pentru servicii.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Furnizor (Provider):</span> Profesionistul
            (freelancer, developer, agenție) care prestează serviciile.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Proiect:</span> Un angajament de lucru definit
            prin livrabile, termene (milestones) și buget.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Smart Escrow:</span> Sistemul prin care
            fondurile Clientului sunt blocate într-un cont securizat și eliberate Furnizorului doar la aprobarea
            livrabilelor.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Service Fee:</span> Comisionul perceput de
            Trustora pentru utilizarea platformei.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">3. ELIGIBILITATE ȘI ÎNREGISTRARE</h3>
        <h4 className="font-semibold text-slate-900 dark:text-white">3.1. Eligibilitate</h4>
        <p>
          Platforma este destinată exclusiv utilizării profesionale (B2B). Utilizatorii trebuie să aibă capacitate deplină
          de exercițiu și să fie:
        </p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Entități juridice legal constituite; sau</li>
          <li>Persoane fizice autorizate (PFA, II) sau care acționează în regim profesional.</li>
        </ul>
        <h4 className="font-semibold text-slate-900 dark:text-white">3.2. Verificarea Identității (KYC/KYB)</h4>
        <p>
          Conform structurii noastre de securitate și a integrării cu Stripe Connect (vizibilă în codul sursă la
          dashboard/stripe/onboard), toți utilizatorii trebuie să parcurgă procesul de verificare a identității.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">4. CREAREA ȘI ADMINISTRAREA PROIECTELOR</h3>
        <p>
          Clientul inițiază un Proiect, stabilește cerințele și bugetul, iar Furnizorul poate aplica sau poate fi invitat
          să participe. Contractarea se realizează prin generarea unui contract digital și stabilirea milestone-urilor.
        </p>
        <p>
          Toate proiectele sunt administrate prin Dashboard-ul Trustora, care oferă funcționalități de comunicare, fișiere
          și management financiar (admin/projects).
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">5. PLĂȚI ȘI ESCROW</h3>
        <p>
          Trustora utilizează un mecanism de escrow integrat cu Stripe pentru a proteja ambele părți. Clientul depune
          fondurile într-un cont escrow, iar Furnizorul primește plata după aprobarea livrabilelor.
        </p>
        <p>
          Nu stocăm datele complete ale cardurilor; acestea sunt procesate direct de Stripe, conform standardelor PCI DSS.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">6. OBLIGAȚIILE UTILIZATORILOR</h3>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Furnizorii trebuie să livreze serviciile conform contractului.</li>
          <li>Clienții trebuie să furnizeze cerințe clare și să aprobe livrabilele în timp util.</li>
          <li>Toți utilizatorii trebuie să respecte legislația aplicabilă și să nu abuzeze platforma.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">7. LIMITAREA RĂSPUNDERII</h3>
        <p>
          Trustora acționează ca platformă de intermediere și nu este parte directă în contractele dintre Client și
          Furnizor. Nu garantăm rezultatul proiectelor, dar oferim mecanisme de securitate și dispute.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">8. PROPRIETATE INTELECTUALĂ</h3>
        <p>
          Conținutul livrat în cadrul proiectelor aparține Clientului după plata integrală, dacă nu se specifică altfel în
          contract. Platforma și toate elementele sale rămân proprietatea Trustora.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">9. CONFIDENȚIALITATE</h3>
        <p>
          Utilizatorii sunt obligați să păstreze confidențialitatea informațiilor schimbate în cadrul proiectelor și să
          respecte Politica de Confidențialitate.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">10. ÎNCETAREA CONTURILOR</h3>
        <p>
          Trustora poate suspenda sau închide conturile utilizatorilor care încalcă acești Termeni, fără notificare
          prealabilă în cazuri grave.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">11. LEGEA APLICABILĂ</h3>
        <p>
          Acești Termeni sunt guvernați de legea română. Litigiile vor fi soluționate de instanțele competente din România.
        </p>
      </section>
    </div>
  );
}

function TermsContentEn({ className, headingClassName }: Omit<TermsContentProps, "locale">) {
  return (
    <div className={cn("space-y-6 text-sm text-slate-600 dark:text-slate-300", className)}>
      <div className="space-y-1">
        <h2 className={cn("text-xl font-semibold text-slate-900 dark:text-white", headingClassName)}>
          TERMS AND CONDITIONS OF USE – TRUSTORA
        </h2>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Last updated: January 17, 2026
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">1. PREAMBLE AND ACCEPTANCE</h3>
        <p>
          Welcome to Trustora (&quot;Platform&quot;, &quot;We&quot;, &quot;Company&quot;). Trustora is a digital infrastructure
          that facilitates collaboration, contracting, and secure payments between Companies (&quot;Clients&quot;) and
          independent Professionals or Agencies (&quot;Providers&quot;).
        </p>
        <p>
          By accessing or using our website (trustora.ro / trustora.com) and related services, you agree to comply with
          these Terms and Conditions (&quot;Terms&quot;). If you do not agree, please do not use the Platform.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">2. DEFINITIONS</h3>
        <p>For clarity, the terms below have the following meaning:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Account:</span> The profile registered on the
            Platform (Client or Provider).
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Client:</span> The legal or authorized natural
            person who initiates a Project and pays for services.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Provider:</span> The professional (freelancer,
            developer, agency) who delivers the services.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Project:</span> A work engagement defined by
            deliverables, milestones, and budget.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Smart Escrow:</span> The system by which the
            Client&apos;s funds are held in a secure account and released to the Provider upon approval of deliverables.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">Service Fee:</span> The commission charged by
            Trustora for using the platform.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">3. ELIGIBILITY AND REGISTRATION</h3>
        <h4 className="font-semibold text-slate-900 dark:text-white">3.1. Eligibility</h4>
        <p>
          The Platform is intended exclusively for professional (B2B) use. Users must have full legal capacity and be:
        </p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Legally established entities; or</li>
          <li>Authorized individuals (PFA, II) or acting in a professional capacity.</li>
        </ul>
        <h4 className="font-semibold text-slate-900 dark:text-white">3.2. Identity Verification (KYC/KYB)</h4>
        <p>
          According to our security structure and Stripe Connect integration (visible in source code at
          dashboard/stripe/onboard), all users must complete the identity verification process.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">4. PROJECT CREATION AND MANAGEMENT</h3>
        <p>
          The Client initiates a Project, defines requirements and budget, and the Provider may apply or be invited to
          participate. Contracting is done through a digital contract and milestone setup.
        </p>
        <p>
          All projects are managed through the Trustora Dashboard, which provides communication, files, and financial
          management features (admin/projects).
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">5. PAYMENTS AND ESCROW</h3>
        <p>
          Trustora uses a Stripe-integrated escrow mechanism to protect both parties. The Client deposits funds into an
          escrow account, and the Provider is paid after deliverables approval.
        </p>
        <p>We do not store full card data; payments are processed directly by Stripe under PCI DSS standards.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">6. USER OBLIGATIONS</h3>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Providers must deliver services according to the contract.</li>
          <li>Clients must provide clear requirements and approve deliverables in a timely manner.</li>
          <li>All users must comply with applicable law and must not abuse the platform.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">7. LIMITATION OF LIABILITY</h3>
        <p>
          Trustora acts as a marketplace platform and is not a direct party to contracts between Client and Provider. We
          do not guarantee project outcomes, but we provide security and dispute mechanisms.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">8. INTELLECTUAL PROPERTY</h3>
        <p>
          Deliverables belong to the Client after full payment, unless otherwise specified in the contract. The platform
          and all its elements remain Trustora property.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">9. CONFIDENTIALITY</h3>
        <p>
          Users must keep information exchanged within projects confidential and comply with the Privacy Policy.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">10. ACCOUNT TERMINATION</h3>
        <p>
          Trustora may suspend or close user accounts that violate these Terms, without prior notice in serious cases.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">11. GOVERNING LAW</h3>
        <p>
          These Terms are governed by Romanian law. Disputes will be resolved by the competent courts in Romania.
        </p>
      </section>
    </div>
  );
}

export function TermsContent({ className, headingClassName, locale }: TermsContentProps) {
  const isEnglish = locale?.toLowerCase().startsWith("en");

  if (isEnglish) {
    return <TermsContentEn className={className} headingClassName={headingClassName} />;
  }

  return <TermsContentRo className={className} headingClassName={headingClassName} />;
}
