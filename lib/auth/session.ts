type SessionLike = {
  accessToken?: unknown;
  refreshToken?: unknown;
} | null | undefined;

export const hasSessionAccessToken = (session: SessionLike) =>
  typeof session?.accessToken === 'string' && session.accessToken.length > 0;

export const hasSessionRefreshToken = (session: SessionLike) =>
  typeof session?.refreshToken === 'string' && session.refreshToken.length > 0;

export const hasSessionAuthTokens = (session: SessionLike) =>
  hasSessionAccessToken(session) || hasSessionRefreshToken(session);
