const localePrefixPattern = /^\/(ro|en)(?=\/|$)/;

export function normalizeImageSrc(src: string): string;
export function normalizeImageSrc(src?: string | null): string | undefined;
export function normalizeImageSrc(src?: string | null) {
  if (!src) {
    return src ?? undefined;
  }

  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  if (src.startsWith('http://') || src.startsWith('https://')) {
    try {
      const url = new URL(src);
      url.pathname = url.pathname.replace(localePrefixPattern, '');
      return url.toString();
    } catch {
      return src;
    }
  }

  return src.replace(localePrefixPattern, '');
};
