import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSetting, setSetting } from '@/lib/settings';
import { getSession } from '@/lib/auth';

const CALENDLY_API = 'https://api.calendly.com';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = process.env.CALENDLY_TOKEN;
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  if (!token) return NextResponse.json({ error: 'CALENDLY_TOKEN missing' }, { status: 400 });

  const meRes = await fetch(`${CALENDLY_API}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) {
    const e = await meRes.text();
    return NextResponse.json({ error: 'Failed to fetch user', details: e }, { status: 500 });
  }
  const me = await meRes.json();
  const userUri: string = me?.resource?.uri;
  if (!userUri) return NextResponse.json({ error: 'No user uri' }, { status: 500 });

  let signingKey = getSetting('calendly_signing_key');
  if (!signingKey) {
    signingKey = crypto.randomBytes(32).toString('hex');
    setSetting('calendly_signing_key', signingKey);
  }

  const callbackUrl = `${baseUrl}/api/webhooks/calendly`;
  const payload = {
    url: callbackUrl,
    events: ['invitee.created', 'invitee.canceled'],
    user: userUri,
    scope: 'user',
    signing_key: signingKey,
  } as any;

  const subRes = await fetch(`${CALENDLY_API}/webhook_subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await subRes.json().catch(() => ({}));
  if (!subRes.ok) return NextResponse.json({ error: 'Failed to create webhook', details: data }, { status: 500 });

  return NextResponse.json({ ok: true, subscription: data });
}
