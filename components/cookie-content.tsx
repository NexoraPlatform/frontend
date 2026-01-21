import { cn } from "@/lib/utils";

type CookieContentProps = {
  className?: string;
  headingClassName?: string;
  locale?: string;
};

function CookieContentRo({ className, headingClassName }: Omit<CookieContentProps, "locale">) {
  return (
    <div className={cn("space-y-6 text-sm text-slate-600 dark:text-slate-300", className)}>
      <div className="space-y-1">
        <h2 className={cn("text-xl font-semibold text-slate-900 dark:text-white", headingClassName)}>
          POLITICA DE COOKIE-URI – TRUSTORA
        </h2>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Ultima actualizare: 17 ianuarie 2026
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
                      Reține limba selectată (RO/EN) pentru a nu o schimba la fiecare pagină.
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

function CookieContentEn({ className, headingClassName }: Omit<CookieContentProps, "locale">) {
  return (
    <div className={cn("space-y-6 text-sm text-slate-600 dark:text-slate-300", className)}>
      <div className="space-y-1">
        <h2 className={cn("text-xl font-semibold text-slate-900 dark:text-white", headingClassName)}>
          COOKIE POLICY – TRUSTORA
        </h2>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Last updated: January 17, 2026
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">1. INTRODUCTION</h3>
        <p>
          Trustora (&quot;We&quot;, &quot;Platform&quot;) uses cookies and similar technologies (such as Local Storage) to
          provide you with an optimal, secure, and personalized browsing experience. This policy explains what these
          technologies are, how we use them, and how you can control them.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">2. WHAT ARE COOKIES?</h3>
        <p>
          Cookies are small text files stored on your device (computer, tablet, phone) when you access our website. They
          allow the platform to &quot;remember&quot; your actions and preferences for a period of time.
        </p>
        <p>
          In addition to cookies, we also use Local Storage, a technology that stores data directly in the browser
          without sending it to the server on every request (used by us for the Dark/Light Mode theme).
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">3. WHAT TYPES OF COOKIES DO WE USE?</h3>
        <p>Based on our source code analysis, Trustora uses the following categories:</p>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">A. Strictly Necessary Cookies (Essential)</h4>
            <p>
              These are vital for the platform to function. Without them, you cannot authenticate, make payments, or use
              security features (Escrow). They do not require your consent.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Cookie name (prefix)
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Provider
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Purpose
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">next-auth.session-token</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Trustora</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">
                      Manages the secure authentication session. Keeps you signed in.
                    </td>
                    <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">Session</td>
                  </tr>
                  <tr>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">next-auth.csrf-token</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Trustora</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">
                      Protection against Cross-Site Request Forgery (CSRF) attacks.
                    </td>
                    <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">Session</td>
                  </tr>
                  <tr>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">__stripe_mid</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Stripe</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">
                      Fraud prevention and identification of risky transactions.
                    </td>
                    <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">__stripe_sid</td>
                    <td className="py-2 pr-4">Stripe</td>
                    <td className="py-2 pr-4">Session identifier for secure payment processing.</td>
                    <td className="py-2">30 min</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">B. Functionality and Preference Cookies</h4>
            <p>These allow the site to remember choices you make to provide enhanced features.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Cookie name / key
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Provider
                    </th>
                    <th className="border-b border-slate-200/60 pb-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">NEXT_LOCALE</td>
                    <td className="border-b border-slate-200/60 py-2 pr-4 dark:border-slate-700">Trustora</td>
                    <td className="border-b border-slate-200/60 py-2 dark:border-slate-700">
                      Remembers the selected language (RO/EN) to avoid switching it on every page.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">theme (Local Storage)</td>
                    <td className="py-2 pr-4">Trustora</td>
                    <td className="py-2">Remembers the visual preference: Dark Mode or Light Mode.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">C. Analytics and Performance Cookies</h4>
            <p>
              Although privacy is our priority, we use tools to monitor errors and improve the platform. These require
              your consent.
            </p>
            <ul className="space-y-1 pl-5 list-disc">
              <li>
                Internal activity tracking: Our code (components/ActivityTracker.tsx) monitors critical actions
                (contract signing, milestone approvals). This data is stored in our database for audit and security
                (Escrow), not in marketing cookies.
              </li>
              <li>
                External analytics (optional): If we implement Google Analytics or Vercel Analytics, the related cookies
                (_ga, _gid) will be enabled only with your consent.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">4. THIRD-PARTY COOKIES</h3>
        <p>
          Trustora integrates external services that may place their own cookies. We do not directly control these files:
        </p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Stripe: For payment processing and identity verification (KYC). Their policy: Stripe Cookie Policy.</li>
          <li>Vercel: Hosting infrastructure may place technical performance cookies.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">5. HOW CAN YOU CONTROL COOKIES?</h3>
        <h4 className="font-semibold text-slate-900 dark:text-white">5.1. Platform Settings</h4>
        <p>
          On your first visit, you will see a consent banner. You can choose to accept only essential cookies. You can
          change your preferences at any time in account settings or via the &quot;Cookie Preferences&quot; link in the
          footer.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white">5.2. Browser Settings</h4>
        <p>
          You can delete stored cookies or configure your browser to block them. Here are instructions for common browsers:
        </p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Google Chrome</li>
          <li>Mozilla Firefox</li>
          <li>Safari</li>
        </ul>
        <p>
          Note: Blocking strictly necessary cookies (Stripe, NextAuth) will make it impossible to authenticate or make
          payments on Trustora.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">6. POLICY UPDATES</h3>
        <p>
          We may update this policy as we add new features (e.g., LinkedIn integrations for login). Please check this page
          periodically.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">7. CONTACT</h3>
        <p>For questions related to cookies, you can contact us at:</p>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Email: contact@trustora.ro</li>
          <li>Address: Otopeni, Ilfov County, Romania</li>
        </ul>
      </section>
    </div>
  );
}

export function CookieContent({ className, headingClassName, locale }: CookieContentProps) {
  const isEnglish = locale?.toLowerCase().startsWith("en");

  if (isEnglish) {
    return <CookieContentEn className={className} headingClassName={headingClassName} />;
  }

  return <CookieContentRo className={className} headingClassName={headingClassName} />;
}
