import { cn } from "@/lib/utils";

type CookieContentProps = {
  className?: string;
  headingClassName?: string;
};

export function CookieContent({ className, headingClassName }: CookieContentProps) {
  return (
    <div className={cn("space-y-6 text-sm text-slate-600 dark:text-slate-300", className)}>
      <div className="space-y-1">
        <h2 className={cn("text-xl font-semibold text-slate-900 dark:text-white", headingClassName)}>
          POLITICA DE COOKIE-URI – TRUSTORA
        </h2>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Ultima actualizare: 2026-01-17
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">1. INTRODUCERE</h3>
        <p>
          Trustora (&quot;Noi&quot;, &quot;Platforma&quot;) utilizează cookie-uri și tehnologii similare (cum ar fi Local
          Storage) pentru a vă oferi o experiență de navigare optimă, sigură și personalizată. Această politică explică
          ce sunt aceste tehnologii, cum le folosim și cum le puteți controla.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">2. CE SUNT COOKIE-URILE?</h3>
        <p>
          Cookie-urile sunt fișiere text mici stocate pe dispozitivul dumneavoastră (computer, tabletă, telefon) atunci
          când accesați site-ul nostru. Ele permit platformei să &quot;țină minte&quot; acțiunile și preferințele
          dumneavoastră pe o anumită perioadă.
        </p>
        <p>
          Pe lângă cookie-uri, folosim și Local Storage (stocare locală), o tehnologie care permite stocarea datelor direct
          în browser, fără a fi trimise la server la fiecare cerere (folosită de noi pentru tema Dark/Light Mode).
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">3. CE TIPURI DE COOKIE-URI FOLOSIM?</h3>
        <p>Bazat pe analiza codului nostru sursă, Trustora utilizează următoarele categorii:</p>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              A. Cookie-uri Strict Necesare (Esențiale)
            </h4>
            <p>
              Acestea sunt vitale pentru funcționarea platformei. Fără ele, nu vă puteți autentifica, nu puteți efectua
              plăți și nu puteți utiliza funcțiile de securitate (Escrow). Nu necesită consimțământul dumneavoastră.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Nume Cookie (Prefix)
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Furnizor
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Scop
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Durată
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">next-auth.session-token</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Trustora</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">
                      Gestionează sesiunea de autentificare securizată. Vă menține logat.
                    </td>
                    <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">Sesiune</td>
                  </tr>
                  <tr>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">next-auth.csrf-token</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Trustora</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">
                      Protecție împotriva atacurilor de tip Cross-Site Request Forgery (CSRF).
                    </td>
                    <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">Sesiune</td>
                  </tr>
                  <tr>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">__stripe_mid</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Stripe</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">
                      Prevenirea fraudei la plăți și identificarea tranzacțiilor riscante.
                    </td>
                    <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">1 an</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">__stripe_sid</td>
                    <td className="py-2 pr-4">Stripe</td>
                    <td className="py-2 pr-4">Identificatorul sesiunii pentru procesarea plăților securizate.</td>
                    <td className="py-2">30 min</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              B. Cookie-uri de Funcționalitate și Preferințe
            </h4>
            <p>
              Acestea permit site-ului să rețină alegerile pe care le faceți pentru a vă oferi funcții îmbunătățite.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Nume Cookie / Key
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Furnizor
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Scop
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">NEXT_LOCALE</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Trustora</td>
                    <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">
                      Reține limba selectată (RO/EN/DE) pentru a nu o schimba la fiecare pagină (hooks/use-locale.ts).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">theme (Local Storage)</td>
                    <td className="py-2 pr-4">Trustora</td>
                    <td className="py-2">Reține preferința vizuală: Mod Întunecat (Dark) sau Luminos (Light).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              C. Cookie-uri de Analiză și Performanță (Tracking)
            </h4>
            <p>
              Deși prioritatea noastră este confidențialitatea, folosim instrumente pentru a monitoriza erorile și a
              îmbunătăți platforma. Acestea necesită consimțământul dumneavoastră.
            </p>
            <ul className="space-y-1 pl-5 list-disc">
              <li>
                Activity Tracking Intern: Codul nostru (components/ActivityTracker.tsx) monitorizează acțiunile critice
                (semnarea contractelor, aprobarea milestone-urilor). Aceste date sunt stocate în baza noastră de date
                pentru audit și securitate (Escrow), nu în cookie-uri de marketing.
              </li>
              <li>
                Analytics Externe (Opțional): Dacă vom implementa Google Analytics sau Vercel Analytics, cookie-urile
                asociate (_ga, _gid) vor fi activate doar cu acordul dumneavoastră.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">4. COOKIE-URI DE LA TERȚI (THIRD PARTY)</h3>
        <p>Trustora integrează servicii externe care pot plasa propriile cookie-uri. Noi nu controlăm direct aceste fișiere:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Stripe: Pentru procesarea plăților și verificarea identității (KYC). Politica lor: Stripe Cookie Policy.</li>
          <li>Vercel: Infrastructura de hosting poate plasa cookie-uri tehnice pentru performanță.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">5. CUM PUTEȚI CONTROLA COOKIE-URILE?</h3>
        <h4 className="font-semibold text-slate-900 dark:text-white">5.1. Din Setările Platformei</h4>
        <p>
          La prima accesare a site-ului, vi se va prezenta un banner de consimțământ. Puteți alege să acceptați doar
          cookie-urile esențiale. Puteți modifica oricând preferințele din setările contului sau din link-ul
          &quot;Preferințe Cookie&quot; din subsolul paginii (Footer).
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white">5.2. Din Browser</h4>
        <p>
          Puteți șterge toate cookie-urile stocate sau puteți configura browser-ul să le blocheze. Iată instrucțiuni pentru
          cele mai populare browsere:
        </p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Google Chrome</li>
          <li>Mozilla Firefox</li>
          <li>Safari</li>
        </ul>
        <p>
          Atenție: Blocarea cookie-urilor strict necesare (Stripe, NextAuth) va face imposibilă autentificarea sau
          efectuarea plăților pe Trustora.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">6. ACTUALIZĂRI ALE POLITICII</h3>
        <p>
          Putem actualiza această politică pe măsură ce adăugăm noi funcționalități (ex: integrări cu LinkedIn pentru
          login). Vă rugăm să verificați periodic această pagină.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">7. CONTACT</h3>
        <p>Pentru întrebări legate de cookie-uri, ne puteți contacta la:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Email: contact@trustora.ro</li>
          <li>Adresă: Otopeni, Jud. Ilfov, România</li>
        </ul>
      </section>
    </div>
  );
}
