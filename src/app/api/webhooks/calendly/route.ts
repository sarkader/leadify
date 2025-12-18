import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSetting } from '@/lib/settings';
import crypto from 'node:crypto';

function verifySignature(body: string, signatureHeader: string | null, key: string) {
  if (!signatureHeader) return false;
  // Calendly uses HMAC SHA-256 with the provided signing_key in their docs.
  try {
    const signature = crypto.createHmac('sha256', key).update(body).digest('hex');
    // Header format may vary; try direct compare or v1=signature pattern.
    if (signatureHeader.includes('=')) {
      const parts = signatureHeader.split(',').map(p=>p.trim());
      const v1 = parts.find(p=>p.startsWith('v1='))?.split('=')[1];
      return !!v1 && v1 === signature;
    }
    return signatureHeader === signature;
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const key = getSetting('calendly_signing_key');
  const sigHeader = req.headers.get('Calendly-Webhook-Signature') || req.headers.get('X-Calendly-Webhook-Signature');
  if (key && !verifySignature(raw, sigHeader, key)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(raw);
  const eventType: string = event?.event;
  const payload = event?.payload;

  if (!eventType || !payload) return NextResponse.json({ ok: true });

  if (eventType === 'invitee.created') {
    const name: string = payload?.invitee?.name || 'Unknown';
    const email: string | undefined = payload?.invitee?.email;
    const start = payload?.event?.start_time ? Date.parse(payload.event.start_time) : undefined;
    const calendlyId: string = payload?.invitee?.uri || payload?.event?.uri || '';

    let lead = email ? db.select().from(leads).where(eq(leads.email, email)).get() : null;
    if (!lead) {
      const res = db.insert(leads).values({ name, email: email || null, source: 'calendly', stage: 'Set' }).run();
      lead = db.select().from(leads).where(eq(leads.id, Number(res.lastInsertRowid))).get();
    } else {
      db.update(leads).set({ stage: 'Set' }).where(eq(leads.id, lead.id!)).run();
    }
    db.insert(appointments).values({ leadId: lead?.id, calendlyId, start: start ? Math.floor(start) : null, status: 'Scheduled' }).run();
  }

  if (eventType === 'invitee.canceled') {
    const calendlyId: string = payload?.invitee?.uri || payload?.event?.uri || '';
    const appt = db.select().from(appointments).where(eq(appointments.calendlyId, calendlyId)).get();
    if (appt) {
      db.update(appointments).set({ status: 'Canceled' }).where(eq(appointments.id, appt.id!)).run();
      if (appt.leadId) db.update(leads).set({ stage: 'Reschedule' }).where(eq(leads.id, appt.leadId)).run();
    }
  }

  return NextResponse.json({ ok: true });
}
