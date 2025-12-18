import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSetting } from '@/lib/settings';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  const clientId = getSetting('google_client_id') || process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/admin/google-callback`;

  if (!clientId) {
    return NextResponse.redirect(new URL('/admin?google_error=not_configured', req.url));
  }

  // Redirect to Google OAuth
  const scopes = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
  return NextResponse.redirect(authUrl);
}
