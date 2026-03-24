import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { unstable_update } from '@/auth';
import {
  fetchPassportUserProfile,
  refreshPassportAccessToken,
} from '@/lib/auth/passport';
import { normalizeAuthUser, sanitizeAuthResponsePayload } from '@/lib/auth/user';

const resolveAccessTokenExpiry = (expiresIn: unknown) => {
  const expiresInSeconds = Number(expiresIn ?? 0);
  return Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
    ? Date.now() + expiresInSeconds * 1000
    : undefined;
};

export async function POST(req: Request) {
  const rawToken = await getToken({
    req: req as any,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  const sessionUser = normalizeAuthUser(rawToken?.user ?? null);
  const refreshToken =
    typeof rawToken?.refreshToken === 'string' && rawToken.refreshToken.length > 0
      ? rawToken.refreshToken
      : null;

  if (!refreshToken) {
    return NextResponse.json({ message: 'Missing refresh token' }, { status: 401 });
  }

  try {
    const refreshed = await refreshPassportAccessToken({
      refreshToken,
      origin: req.headers.get('origin'),
    });

    if (!refreshed?.access_token) {
      throw new Error('Refresh token request did not return an access token.');
    }

    const profilePayload = await fetchPassportUserProfile(refreshed.access_token, {
      origin: req.headers.get('origin'),
      includeConnectedAccounts: true,
    }).catch(() => null);

    const nextUser =
      normalizeAuthUser(profilePayload) ?? sessionUser;
    const nextTokenType =
      typeof refreshed.token_type === 'string' && refreshed.token_type.length > 0
        ? refreshed.token_type
        : (typeof rawToken?.tokenType === 'string' && rawToken.tokenType.length > 0
            ? rawToken.tokenType
            : 'Bearer');
    const nextRefreshToken = refreshed.refresh_token || refreshToken;
    const nextAccessTokenExpiresAt = resolveAccessTokenExpiry(refreshed.expires_in);

    const updatedSession = await unstable_update({
      ...(nextUser ? { user: nextUser } : {}),
      accessToken: refreshed.access_token,
      refreshToken: nextRefreshToken,
      tokenType: nextTokenType,
      accessTokenExpiresAt: nextAccessTokenExpiresAt,
      error: null as any,
    });

    return NextResponse.json(
      sanitizeAuthResponsePayload(
        updatedSession ?? {
          ...(rawToken ? { user: sessionUser } : {}),
          user: nextUser,
          accessToken: refreshed.access_token,
          refreshToken: nextRefreshToken,
          tokenType: nextTokenType,
          accessTokenExpiresAt: nextAccessTokenExpiresAt,
          error: undefined,
        }
      ),
      { status: 200 }
    );
  } catch (error) {
    await unstable_update({
      accessToken: null as any,
      refreshToken: null as any,
      tokenType: null as any,
      accessTokenExpiresAt: null as any,
      error: 'RefreshAccessTokenError',
    }).catch(() => null);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Unable to refresh access token',
      },
      { status: 401 }
    );
  }
}
