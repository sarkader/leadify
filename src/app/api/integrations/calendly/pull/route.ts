import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';

const API = 'https://api.calendly.com';

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(()=>null);
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

export async function POST() {
  const token = process.env.CALENDLY_TOKEN;
  if (!token) return NextResponse.json({ error: 'Missing CALENDLY_TOKEN' }, { status: 400 });

  const headers = { Authorization: `Bearer ${token}` } as any;
  const me = await fetchJSON(`${API}/users/me`, { headers });
  const userUri = me?.resource?.uri;
  if (!userUri) return NextResponse.json({ error: 'No user' }, { status: 500 });

  // Pull recent scheduled events
  const events = await fetchJSON(`${API}/scheduled_events?user=${encodeURIComponent(userUri)}&count=100&sort=start_time:desc`, { headers });
  const items = events?.collection || [];
  let upserted = 0;

  for (const ev of items) {
    const evUri: string = ev.uri;
    const start = ev.start_time ? Date.parse(ev.start_time) : null;
    const invitees = await fetchJSON(`${API}/scheduled_events/${ev.uuid}/invitees`, { headers });
    const inv = invitees?.collection?.[0];
    const email: string | null = inv?.email || null;

    let lead = email ? db.select().from(leads).where(eq(leads.email, email)).get() : null;
    if (!lead && email) {
      const res = db.insert(leads).values({ name: inv?.name || 'Lead', email, source: 'calendly', stage: 'Set' }).run();
      lead = db.select().from(leads).where(eq(leads.id, Number(res.lastInsertRowid))).get();
    }
    if (lead) {
      const exists = db.select().from(appointments).where(eq(appointments.calendlyId, evUri)).get();
      if (!exists) {
        db.insert(appointments).values({ leadId: lead.id!, calendlyId: evUri, start: start ? Math.floor(start) : null, status: 'Scheduled' }).run();
        upserted++;
      }
    }
  }

  return NextResponse.json({ ok: true, upserted });
}
