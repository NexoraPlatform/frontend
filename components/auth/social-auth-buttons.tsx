"use client";

type AuthSocialProvider = "google" | "github";

type AuthSocialButtonsProps = {
  githubText: string;
  googleText: string;
  onProviderSelect: (provider: AuthSocialProvider) => void;
};

export function AuthSocialButtons({
  githubText,
  googleText,
  onProviderSelect,
}: AuthSocialButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onProviderSelect("google")}
        className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-primary/30 hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-background/50 dark:text-white dark:hover:bg-background/80"
      >
        <GoogleIcon className="h-5 w-5 shrink-0" />
        <span>{googleText}</span>
      </button>

      <button
        type="button"
        onClick={() => onProviderSelect("github")}
        className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-primary/30 hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-background/50 dark:text-white dark:hover:bg-background/80"
      >
        <GitHubIcon className="h-5 w-5 shrink-0 text-slate-900 dark:text-white" />
        <span>{githubText}</span>
      </button>
    </div>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M21.805 12.223c0-.727-.065-1.426-.186-2.097H12.24v3.973h5.366a4.59 4.59 0 0 1-1.99 3.01v2.49h3.223c1.887-1.737 2.966-4.297 2.966-7.376Z"
        fill="#4285F4"
      />
      <path
        d="M12.24 22c2.688 0 4.943-.89 6.59-2.41l-3.223-2.49c-.89.597-2.03.95-3.367.95-2.585 0-4.775-1.745-5.557-4.092H3.35v2.569A9.95 9.95 0 0 0 12.24 22Z"
        fill="#34A853"
      />
      <path
        d="M6.683 13.958a5.98 5.98 0 0 1 0-3.916V7.473H3.35a9.95 9.95 0 0 0 0 9.054l3.333-2.569Z"
        fill="#FBBC04"
      />
      <path
        d="M12.24 5.95c1.46 0 2.773.502 3.804 1.486l2.853-2.853C17.18 2.981 14.926 2 12.24 2A9.95 9.95 0 0 0 3.35 7.473l3.333 2.569C7.465 7.695 9.655 5.95 12.24 5.95Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2C6.478 2 2 6.59 2 12.25c0 4.528 2.865 8.37 6.839 9.727.5.096.682-.223.682-.495 0-.244-.01-1.052-.014-1.907-2.782.62-3.37-1.214-3.37-1.214-.455-1.188-1.11-1.504-1.11-1.504-.908-.639.069-.626.069-.626 1.004.073 1.532 1.06 1.532 1.06.892 1.574 2.341 1.12 2.91.856.09-.665.35-1.12.636-1.377-2.221-.262-4.555-1.145-4.555-5.094 0-1.126.39-2.047 1.03-2.769-.104-.263-.447-1.321.098-2.754 0 0 .84-.277 2.75 1.058A9.303 9.303 0 0 1 12 6.836c.85.004 1.706.118 2.505.347 1.908-1.335 2.747-1.058 2.747-1.058.547 1.433.203 2.491.1 2.754.64.722 1.028 1.643 1.028 2.769 0 3.959-2.338 4.829-4.565 5.086.359.319.678.944.678 1.903 0 1.374-.012 2.48-.012 2.817 0 .274.18.596.688.494C19.138 20.617 22 16.776 22 12.25 22 6.59 17.522 2 12 2Z" />
    </svg>
  );
}
