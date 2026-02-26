import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/server-auth';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const key = (process.env.PUSHER_KEY || '').trim();
  const cluster = (process.env.PUSHER_CLUSTER || '').trim();

  if (!key || !cluster) {
    return NextResponse.json(
      { message: 'Realtime is not configured' },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json({ key, cluster }, { headers: NO_STORE_HEADERS });
}
