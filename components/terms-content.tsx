import { cn } from "@/lib/utils";

type TermsContentProps = {
  className?: string;
  headingClassName?: string;
};

export function TermsContent({ className, headingClassName }: TermsContentProps) {
  return (
    <div className={cn("space-y-6 text-sm text-slate-600 dark:text-slate-300", className)}>
      <div className="space-y-1">
        <h2 className={cn("text-xl font-semibold text-slate-900 dark:text-white", headingClassName)}>
          TERMENI ȘI CONDIȚII DE UTILIZARE – TRUSTORA
        </h2>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Ultima actualizare: [Data Curentă]
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
        <p>
          Furnizori: Trustora își rezervă dreptul de a testa competențele tehnice (secțiunea admin/tests din platformă) și
          de a solicita interviuri video înainte de activarea contului.
        </p>
        <p>Clienți: Pot fi solicitate documente care atestă existența legală a companiei.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">4. SERVICIILE TRUSTORA</h3>
        <h4 className="font-semibold text-slate-900 dark:text-white">4.1. Rolul de Intermediar</h4>
        <p>
          Trustora acționează ca un intermediar tehnologic și administrativ (&quot;Legal Wrapper&quot;). Noi nu suntem
          angajatorul Furnizorilor și nu controlăm direct modul în care aceștia își execută sarcinile, evitând astfel
          riscurile de &quot;angajare mascată&quot;.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white">4.2. Contractarea</h4>
        <p>
          Când un Client și un Furnizor cad de acord asupra unui Proiect, se formează un Contract de Servicii direct între
          aceștia, guvernat de termenii specifici ai Proiectului și de acești Termeni și Condiții. Trustora furnizează
          cadrul contractual standardizat pentru a proteja ambele părți.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">5. PLĂȚI, TAXE ȘI ESCROW</h3>
        <p>Modelul nostru de business este diferit de marketplace-urile clasice.</p>
        <h4 className="font-semibold text-slate-900 dark:text-white">5.1. Structura Comisioanelor</h4>
        <p>
          Clientul: Plătește valoarea Proiectului + un Service Fee (Taxă de Serviciu) cuprins între 10% și 15% (conform
          Planului de Afaceri). Această taxă acoperă securitatea plății, procesarea contractuală și utilizarea platformei.
        </p>
        <p>
          Furnizorul: Primește 100% din rata negociată pentru proiect (minus eventualele taxe de procesare bancară/Stripe,
          dacă sunt aplicabile direct contului lor).
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white">5.2. Mecanismul Smart Escrow</h4>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Depunere: La inițierea unui Proiect sau a unui Milestone, Clientul depune fondurile în Escrow (prin Stripe).</li>
          <li>Blocare: Fondurile sunt securizate și nu pot fi accesate de Furnizor până la livrare.</li>
          <li>
            Eliberare: Fondurile sunt transferate în contul Furnizorului (&quot;Payout&quot;) doar după ce Clientul aprobă
            livrabilul prin interfața Platformei.
          </li>
        </ul>
        <h4 className="font-semibold text-slate-900 dark:text-white">5.3. Taxe și Impozite</h4>
        <p>
          Utilizatorii sunt exclusiv responsabili pentru declararea și plata taxelor locale (impozit pe venit, TVA,
          contribuții sociale) aferente veniturilor obținute sau plăților efectuate. Trustora nu acționează ca agent
          fiscal, cu excepția situațiilor impuse explicit de lege.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">6. PROPRIETATE INTELECTUALĂ</h3>
        <h4 className="font-semibold text-slate-900 dark:text-white">6.1. Transferul Drepturilor</h4>
        <p>Dacă nu se specifică altfel în Contractul de Servicii specific Proiectului:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Drepturile de proprietate intelectuală asupra lucrării livrate se transferă de la Furnizor la Client doar în momentul plății integrale a sumelor datorate.</li>
          <li>Până la plata integrală, Furnizorul reține drepturile de autor.</li>
        </ul>
        <h4 className="font-semibold text-slate-900 dark:text-white">6.2. Proprietatea Platformei</h4>
        <p>
          Codul sursă Trustora, logo-ul, design-ul (bazat pe Trustora - Story.docx), textele și funcționalitățile sunt
          proprietatea exclusivă a Trustora.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">7. REZOLVAREA DISPUTELOR</h3>
        <h4 className="font-semibold text-slate-900 dark:text-white">7.1. Negociere Directă</h4>
        <p>Încurajăm părțile să rezolve neînțelegerile amiabil folosind sistemul de Chat intern (components/chat).</p>
        <h4 className="font-semibold text-slate-900 dark:text-white">7.2. Intervenția Trustora</h4>
        <p>
          În cazul în care nu se ajunge la un acord, oricare parte poate iniția o Dispută (secțiunea admin/disputes din
          platformă).
        </p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Trustora va acționa ca arbitru imparțial.</li>
          <li>Vom analiza dovezile (livrabilele încărcate, istoricul conversațiilor, specificațiile proiectului).</li>
          <li>Decizia Trustora cu privire la distribuirea fondurilor din Escrow este finală pentru scopurile Platformei.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          8. POLITICA DE NON-CIRCUMVENȚIE (NON-CIRCUMVENTION)
        </h3>
        <p>Pentru a menține viabilitatea modelului nostru de business:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>
            Interdicție: Utilizatorilor le este strict interzis să propună sau să accepte plăți în afara Platformei pentru
            proiectele inițiate sau contactele stabilite prin Trustora.
          </li>
          <li>
            Sancțiuni: Încălcarea acestei reguli duce la suspendarea imediată a contului și posibilitatea solicitării de
            daune interese echivalente cu taxele pierdute.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">9. CONDUITA UTILIZATORULUI</h3>
        <p>Este interzisă:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Publicarea de conținut ilegal, ofensator sau fals.</li>
          <li>Subcontractarea neautorizată a proiectelor (Furnizorul trebuie să execute lucrarea personal, cu excepția cazului în care este înregistrat ca Agenție).</li>
          <li>Manipularea sistemului de feedback sau reputație.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">10. LIMITAREA RĂSPUNDERII</h3>
        <p>
          Trustora furnizează platforma &quot;așa cum este&quot; (&quot;as is&quot;). Deși depunem eforturi pentru a
          verifica Furnizorii (prin teste și interviuri), nu garantăm:
        </p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Calitatea, siguranța sau legalitatea serviciilor prestate de Furnizori.</li>
          <li>Capacitatea Clienților de a plăti (deși Escrow-ul mitigează acest risc).</li>
          <li>Funcționarea neîntreruptă a site-ului.</li>
        </ul>
        <p>
          Trustora nu va fi răspunzătoare pentru daune indirecte, pierderi de profit sau date. Răspunderea noastră totală
          este limitată la valoarea Service Fee-ului încasat de noi pentru tranzacția în cauză.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">11. ÎNCETAREA CONTULUI</h3>
        <p>Trustora își rezervă dreptul de a suspenda sau șterge conturi pentru:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Încălcarea acestor Termeni.</li>
          <li>Activitate frauduloasă.</li>
          <li>Scoruri de performanță scăzute în mod repetat (pentru Furnizori).</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">12. LEGEA APLICABILĂ ȘI JURISDICȚIA</h3>
        <p>
          Acești Termeni sunt guvernați de legea din România. Orice litigiu care nu poate fi rezolvat amiabil sau prin
          arbitrajul Platformei va fi supus instanțelor competente din București/Ilfov (conform sediului menționat în
          Otopeni).
        </p>
      </section>
    </div>
  );
}
