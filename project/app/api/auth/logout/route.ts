import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { success: true },
    { status: 200 }
  );

  response.cookies.delete('supabase-auth-token');

  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/', ''), { status: 302 });
  response.cookies.delete('supabase-auth-token');
  return response;
}
