import { cn } from "@/lib/utils";

type PrivacyContentProps = {
  className?: string;
  headingClassName?: string;
};

export function PrivacyContent({ className, headingClassName }: PrivacyContentProps) {
  return (
    <div className={cn("space-y-6 text-sm text-slate-600 dark:text-slate-300", className)}>
      <div className="space-y-1">
        <h2 className={cn("text-xl font-semibold text-slate-900 dark:text-white", headingClassName)}>
          POLITICA DE CONFIDENȚIALITATE – TRUSTORA
        </h2>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Data intrării în vigoare: [Data Curentă]
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">1. INTRODUCERE</h3>
        <p>
          Confidențialitatea datelor dumneavoastră este fundamentală pentru Trustora (&quot;Noi&quot;, &quot;Platforma&quot;,
          &quot;Compania&quot;). În calitate de infrastructură digitală de încredere (&quot;Digital Trust Infrastructure&quot;),
          ne angajăm să protejăm informațiile personale ale Clienților și Furnizorilor (Provideri) care utilizează
          serviciile noastre.
        </p>
        <p>
          Această Politică explică modul în care colectăm, utilizăm, stocăm și protejăm datele dumneavoastră atunci când
          accesați site-ul nostru (trustora.ro / trustora.com) și utilizați aplicația noastră.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">2. OPERATORUL DE DATE</h3>
        <p>Operatorul datelor dumneavoastră cu caracter personal este:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Denumire Companie: [Numele Persoanei Juridice, ex: Trustora Tech S.R.L.]</li>
          <li>Sediu Social: Otopeni, Jud. Ilfov, România</li>
          <li>Email contact GDPR: contact@trustora.ro</li>
          <li>Reprezentant: Ion Arsene Claudiu</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">3. CE DATE COLECTĂM</h3>
        <p>Colectăm datele necesare pentru a facilita contractarea B2B, plățile securizate și verificarea identității.</p>
        <h4 className="font-semibold text-slate-900 dark:text-white">3.1. Date furnizate direct de dumneavoastră</h4>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Date de Cont: Nume, prenume, adresă de email, parolă (stocată criptat), număr de telefon.</li>
          <li>
            Date de Profil (Furnizori): CV-uri, portofoliu, abilități tehnice (admin/services), rata orară/pe proiect,
            fotografie de profil.
          </li>
          <li>
            Date de Identificare (KYC/KYB): Pentru verificarea identității, putem colecta copii ale actelor de identitate,
            certificate de înregistrare a firmei (CUI/CIF), extrase bancare.
          </li>
          <li>
            Notă: Procesarea documentelor sensibile de identitate se face predominant prin partenerul nostru Stripe,
            conform standardelor bancare de securitate.
          </li>
          <li>
            Date Financiare: Detalii cont bancar (IBAN), istoric tranzacții, detalii facturare. Nu stocăm numere complete
            de card pe serverele noastre; acestea sunt procesate securizat de Stripe.
          </li>
          <li>
            Comunicări: Mesajele trimise prin sistemul nostru de Chat (components/chat), detaliile despre apelurile video
            programate (admin/calls) și fișierele încărcate în cadrul proiectelor.
          </li>
          <li>
            Interviuri Video: Înregistrări sau note rezultate din procesul de verificare video a Furnizorilor, necesare
            pentru validarea competențelor (&quot;Verified People&quot;).
          </li>
        </ul>
        <h4 className="font-semibold text-slate-900 dark:text-white">3.2. Date colectate automat</h4>
        <p>Când utilizați Platforma, codul nostru (ActivityTracker.tsx, analytics) colectează automat:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Adresa IP și date despre dispozitiv/browser.</li>
          <li>
            Jurnale de activitate (Log-uri): data și ora accesării, paginile vizitate, acțiunile efectuate (ex: semnarea
            unui contract, aprobarea unui milestone).
          </li>
          <li>Cookies și tehnologii similare (pentru menținerea sesiunii de autentificare și preferințe de limbă - LocaleSwitcher).</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          4. SCOPURILE ȘI TEMEIUL LEGAL AL PRELUCRĂRII
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                  Scopul Prelucrării
                </th>
                <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                  Temeiul Legal (GDPR)
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-600 dark:text-slate-300">
              <tr>
                <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Crearea și administrarea contului</td>
                <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">Executarea contractului (Termeni și Condiții)</td>
              </tr>
              <tr>
                <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Procesarea plăților și Escrow</td>
                <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">Executarea contractului</td>
              </tr>
              <tr>
                <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Verificarea identității (KYC/KYB)</td>
                <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">
                  Obligație legală (prevenirea spălării banilor) și Interes Legitim (securitatea platformei)
                </td>
              </tr>
              <tr>
                <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Facilitarea contractelor între Client și Provider</td>
                <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">Executarea contractului</td>
              </tr>
              <tr>
                <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Comunicări de serviciu (notificări proiect)</td>
                <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">Executarea contractului</td>
              </tr>
              <tr>
                <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Analiza performanței și securitate</td>
                <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">Interes Legitim (îmbunătățirea serviciilor)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Marketing (Newsletter)</td>
                <td className="py-2">Consimțământul dumneavoastră explicit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">5. PARTAJAREA DATELOR CU TERȚI</h3>
        <p>Nu vindem datele dumneavoastră. Le transmitem doar partenerilor necesari funcționării serviciului:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>
            Procesatori de Plăți (Stripe): Pentru procesarea plăților, gestionarea conturilor &quot;Connected Accounts&quot; și
            procedurile de verificare a identității. Politica lor de confidențialitate se aplică datelor colectate direct
            de ei (dashboard/stripe/onboard).
          </li>
          <li>Furnizori de Infrastructură: Servicii de hosting (ex: Vercel, AWS), baze de date (ex: Supabase/PostgreSQL) și stocare fișiere.</li>
          <li>Autorități: Dacă suntem obligați prin lege (ex: ANAF, autorități judiciare) să raportăm activități financiare sau suspecte.</li>
          <li>Ceilalți Utilizatori: Clienții văd profilul profesional al Furnizorului.</li>
          <li>
            Părțile implicate într-un Proiect văd datele de identificare necesare generării Contractului de Servicii.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">6. TRANSFERUL INTERNAȚIONAL DE DATE</h3>
        <p>Trustora operează predominant în Spațiul Economic European (SEE).</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Transferurile către Marea Britanie (UK) sunt acoperite de &quot;Decizia de Adecvare&quot; a Comisiei Europene.</li>
          <li>
            Dacă utilizăm furnizori din SUA (ex: pentru servicii de email sau analytics), ne asigurăm că aceștia participă
            la Data Privacy Framework (DPF) sau semnăm Clauze Contractuale Standard (SCC) pentru a garanta protecția
            datelor.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">7. SECURITATEA DATELOR</h3>
        <p>Implementăm măsuri tehnice și organizatorice robuste, reflectate în codul sursă al platformei:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Criptare: Datele sensibile sunt criptate în tranzit (SSL/TLS) și în repaus.</li>
          <li>
            Controlul Accesului: Folosim autentificare securizată (server-auth.ts, middleware.ts) și roluri de utilizator
            stricte (Admin, Client, Provider) pentru a limita accesul la date (PermissionMatrixTab).
          </li>
          <li>Audit: Monitorizăm activitatea pentru a detecta tentativele de fraudă sau acces neautorizat (ActivityTracker).</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">8. PĂSTRAREA DATELOR (RETENTION)</h3>
        <p>Vom păstra datele doar atât timp cât este necesar:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Datele Contului: Pe durata existenței contului + 30 de zile după ștergere (pentru backup).</li>
          <li>Date Financiare și Contractuale: Minim 5 sau 10 ani, conform obligațiilor legale fiscale și de arhivare din România.</li>
          <li>Date Tehnice (Logs): Până la 12 luni, pentru securitate.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">9. DREPTURILE DUMNEAVOASTRĂ</h3>
        <p>Conform GDPR, aveți următoarele drepturi:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Dreptul de acces: Să cereți o copie a datelor pe care le deținem.</li>
          <li>Dreptul la rectificare: Să corectați datele inexacte din profil (app/[locale]/provider/profile).</li>
          <li>
            Dreptul la ștergere (&quot;Dreptul de a fi uitat&quot;): Să solicitați ștergerea contului, cu excepția datelor pe
            care suntem obligați legal să le păstrăm (ex: facturi).
          </li>
          <li>Dreptul la restricționare și opoziție.</li>
          <li>Dreptul la portabilitatea datelor.</li>
        </ul>
        <p>Pentru exercitarea acestor drepturi, contactați-ne la contact@trustora.ro.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">10. POLITICA PRIVIND COOKIE-URILE</h3>
        <p>Platforma folosește cookie-uri esențiale pentru:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Autentificare (să rămâneți logat).</li>
          <li>Securitate (prevenirea atacurilor CSRF).</li>
          <li>Preferințe (limbă, temă dark/light).</li>
        </ul>
        <p>Puteți controla cookie-urile din setările browser-ului, dar dezactivarea celor esențiale poate afecta funcționarea platformei.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">11. ACTUALIZĂRI</h3>
        <p>
          Putem actualiza periodic această Politică. Orice modificare majoră va fi notificată prin email sau printr-un
          mesaj vizibil în Dashboard-ul aplicației.
        </p>
      </section>
    </div>
  );
}
