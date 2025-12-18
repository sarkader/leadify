import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSetting } from '@/lib/settings';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = getSetting('google_client_id') || process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Google Calendar integration coming soon. Please add GOOGLE_CLIENT_ID in Admin Settings first.' }, { status: 400 });
  }

  // TODO: Implement Google Calendar OAuth flow
  return NextResponse.json({ ok: true, message: 'Google Calendar integration coming soon!' });
}

