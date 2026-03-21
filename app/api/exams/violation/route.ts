import { NextResponse } from 'next/server';
import {
  API_BASE_URL,
  appendSetCookie,
  buildProxyHeaders,
  type ProxyHeaderOptions,
  ProxySecurityError,
} from '@/lib/server/laravel-proxy';

const maskValue = (value?: string | null) => {
  if (!value) {
    return null;
  }

  if (value.length <= 12) {
    return `${value.slice(0, 4)}...(${value.length})`;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)} (${value.length})`;
};

const summarizeCookies = (cookieHeader?: string | null) => {
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader
    .split(/;\s*/)
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf('=');
      const name = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry;
      const value = separatorIndex >= 0 ? entry.slice(separatorIndex + 1) : '';

      return {
        name,
        valuePreview: maskValue(value),
        valueLength: value.length,
      };
    });
};

const getSetCookieSummary = (response: Response) => {
  const getSetCookie = (response.headers as Headers & {
    getSetCookie?: () => string[];
  }).getSetCookie?.bind(response.headers);
  const cookies = Array.isArray(getSetCookie?.()) ? getSetCookie() : [];

  if (cookies.length > 0) {
    return cookies.map((cookie) => {
      const separatorIndex = cookie.indexOf('=');
      return separatorIndex >= 0 ? cookie.slice(0, separatorIndex) : cookie;
    });
  }

  const singleHeader = response.headers.get('set-cookie');
  if (!singleHeader) {
    return [];
  }

  return singleHeader
    .split(/,(?=[^;,]+=[^;,]+)/g)
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const separatorIndex = cookie.indexOf('=');
      return separatorIndex >= 0 ? cookie.slice(0, separatorIndex) : cookie;
    });
};

const safeParseJson = (value: string) => {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getCookieValue = (cookieHeader: string | null | undefined, name: string) => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(/;\s*/);
  for (const entry of cookies) {
    const separatorIndex = entry.indexOf('=');
    const key = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry;
    if (key !== name) {
      continue;
    }

    const rawValue = separatorIndex >= 0 ? entry.slice(separatorIndex + 1) : '';
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
};

export async function POST(req: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();
  const contentType = req.headers.get('content-type') ?? 'application/json';
  const rawBody = await req.text();
  const cookieXsrfToken = getCookieValue(req.headers.get('cookie'), 'XSRF-TOKEN');
  const parsedBody =
    contentType.includes('application/json') && rawBody
      ? safeParseJson(rawBody)
      : null;
  const explicitXsrfToken =
    parsedBody && typeof parsedBody.xsrf_token === 'string'
      ? parsedBody.xsrf_token
      : cookieXsrfToken;
  const forwardedBody =
    parsedBody && 'xsrf_token' in parsedBody
      ? JSON.stringify(
          Object.fromEntries(
            Object.entries(parsedBody).filter(([key]) => key !== 'xsrf_token')
          )
        )
      : rawBody;

  console.info(`[exam-violation-proxy:${requestId}] incoming`, {
    method: req.method,
    url: req.url,
    contentType,
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    incomingXsrfHeader: maskValue(req.headers.get('x-xsrf-token')),
    incomingCookies: summarizeCookies(req.headers.get('cookie')),
    cookieXsrfToken: maskValue(cookieXsrfToken),
    bodyXsrfToken: maskValue(
      parsedBody && typeof parsedBody.xsrf_token === 'string'
        ? parsedBody.xsrf_token
        : null
    ),
    rawBody,
    parsedBody,
  });

  let headers: Headers;
  try {
    const proxyHeaderOptions: ProxyHeaderOptions = {
      explicitXsrfToken,
      skipCsrfCheck: true,
    };

    headers = buildProxyHeaders(
      req,
      {
        'Content-Type': contentType,
      },
      proxyHeaderOptions
    );
  } catch (error) {
    const status =
      error instanceof ProxySecurityError && typeof error.status === 'number'
        ? error.status
        : 500;
    const message =
      error instanceof Error ? error.message : 'Unknown proxy security error';

    console.error(`[exam-violation-proxy:${requestId}] header-build-failed`, {
      status,
      message,
      error,
    });

    return NextResponse.json(
      {
        message,
        requestId,
      },
      { status }
    );
  }

  console.info(`[exam-violation-proxy:${requestId}] forwarding`, {
    targetUrl: `${API_BASE_URL}/exam/violations`,
    outgoingXsrfHeader: maskValue(headers.get('x-xsrf-token')),
    outgoingOrigin: headers.get('origin'),
    outgoingReferer: headers.get('referer'),
    outgoingCookies: summarizeCookies(headers.get('cookie')),
    forwardedBody,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/exam/violations`, {
      method: 'POST',
      headers,
      body: forwardedBody || undefined,
      cache: 'no-store',
    });

    const payload = await response.text();
    const durationMs = Date.now() - startedAt;

    console.info(`[exam-violation-proxy:${requestId}] laravel-response`, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      setCookieHeaders: getSetCookieSummary(response),
      durationMs,
      payload,
    });

    const nextResponse = new NextResponse(payload, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });

    appendSetCookie(response, nextResponse, req);
    return nextResponse;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    console.error(`[exam-violation-proxy:${requestId}] fetch-failed`, {
      durationMs,
      error,
    });

    return NextResponse.json(
      {
        message: 'Exam violation proxy failed',
        requestId,
      },
      { status: 500 }
    );
  }
}
