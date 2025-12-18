import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSetting, setSetting } from '@/lib/settings';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    calendlyToken: getSetting('calendly_token') || process.env.CALENDLY_TOKEN || '',
    closeApiKey: getSetting('close_api_key') || process.env.CLOSE_API_KEY || '',
    googleClientId: getSetting('google_client_id') || process.env.GOOGLE_CLIENT_ID || '',
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { calendlyToken, closeApiKey, googleClientId } = await req.json();

  if (calendlyToken) setSetting('calendly_token', calendlyToken);
  if (closeApiKey) setSetting('close_api_key', closeApiKey);
  if (googleClientId) setSetting('google_client_id', googleClientId);

  return NextResponse.json({ ok: true, message: 'Settings saved' });
}

