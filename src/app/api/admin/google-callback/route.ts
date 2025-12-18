import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSetting, setSetting } from '@/lib/settings';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/admin?google_error=${encodeURIComponent(error)}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/admin?google_error=no_code', req.url));
  }

  const clientId = getSetting('google_client_id') || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = getSetting('google_client_secret') || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/admin/google-callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/admin?google_error=not_configured', req.url));
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL(`/admin?google_error=${encodeURIComponent(tokens.error || 'token_failed')}`, req.url));
    }

    setSetting('google_access_token', tokens.access_token);
    if (tokens.refresh_token) setSetting('google_refresh_token', tokens.refresh_token);
    setSetting('google_token_expiry', String(Date.now() + (tokens.expires_in * 1000)));

    return NextResponse.redirect(new URL('/admin?google_connected=1', req.url));
  } catch (error: any) {
    return NextResponse.redirect(new URL(`/admin?google_error=${encodeURIComponent(error.message)}`, req.url));
  }
}

