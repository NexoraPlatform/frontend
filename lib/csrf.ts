import axios from '@/lib/axios';

const getCookieValue = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
};

let csrfPromise: Promise<void> | null = null;

export const getXsrfToken = () => {
  const value = getCookieValue('XSRF-TOKEN');
  return value ? decodeURIComponent(value) : null;
};

export const ensureCsrfCookie = async () => {
  if (typeof window === 'undefined') return;
  if (getCookieValue('XSRF-TOKEN')) return;

  if (!csrfPromise) {
    csrfPromise = axios
      .get('/sanctum/csrf-cookie')
      .then(() => {
        csrfPromise = null;
      })
      .catch((error) => {
        csrfPromise = null;
        throw error;
      });
  }

  await csrfPromise;
};
