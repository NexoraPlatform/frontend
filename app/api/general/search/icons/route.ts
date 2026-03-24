import {
  API_BASE_URL,
  buildAuthenticatedProxyHeaders,
  buildProxyTextResponse,
  mergeProxySearchParams,
} from '@/lib/server/laravel-proxy';

export async function GET(req: Request) {
  const targetUrl = mergeProxySearchParams(req, new URL(`${API_BASE_URL}/general/search/icons`));
  const headers = await buildAuthenticatedProxyHeaders(req);
  const response = await fetch(targetUrl.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });
  return buildProxyTextResponse(response, req);
}
