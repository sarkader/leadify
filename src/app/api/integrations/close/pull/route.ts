import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leads } from '@/db/schema';

const BASE = 'https://api.close.com/api/v1';

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(()=>null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export async function POST() {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing CLOSE_API_KEY' }, { status: 400 });
  let next: string | null = `${BASE}/lead/?_fields=id,display_name,emails,phones,timezone,source`;

  let imported = 0;
  while (next) {
    const data = await fetchJSON(next, { headers: { Authorization: `Bearer ${apiKey}` } });
    const results = data?.data || data?.results || [];
    for (const r of results) {
      const email = Array.isArray(r.emails) && r.emails[0]?.email ? r.emails[0].email : null;
      const phone = Array.isArray(r.phones) && r.phones[0]?.phone ? r.phones[0].phone : null;
      const name = r.display_name || 'Lead';
      const existing = email ? db.select().from(leads).where(leads.email.equals(email) as any).get() : null;
      if (existing) {
        db.update(leads).set({ name, phone, timezone: r.timezone || null, source: r.source || 'close' }).where(leads.id.equals(existing.id!) as any).run();
      } else {
        db.insert(leads).values({ name, email, phone, timezone: r.timezone || null, source: 'close' }).run();
      }
      imported++;
    }
    next = data?.has_more && data?.next ? `${BASE}${data.next}` : null;
    if (!data?.has_more && data?._has_more) next = null;
  }

  return NextResponse.json({ ok: true, imported });
}
