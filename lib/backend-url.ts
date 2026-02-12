export const resolveBackendUrl = () => {
  const explicitBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (explicitBackendUrl) {
    return explicitBackendUrl.replace(/\/+$/, '');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) return '';

  return apiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
};

export const buildOAuthRedirectUrl = (provider: string) => {
  const backendUrl = resolveBackendUrl();
  if (!backendUrl) return '';
  return `${backendUrl}/auth/${provider}/redirect`;
};
