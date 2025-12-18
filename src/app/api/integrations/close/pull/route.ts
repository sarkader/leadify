import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const BASE = 'https://api.close.com/api/v1';

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(()=>null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing CLOSE_API_KEY' }, { status: 400 });
  let next: string | null = `${BASE}/lead/?_fields=id,display_name,emails,phones,timezone,source`;

  let imported = 0;
  while (next) {
    const data = await fetchJSON(next, { headers: { Authorization: `Bearer ${apiKey}` } });
    const results = data?.data || data?.results || [];
    for (const r of results) {
      const externalId = typeof r?.id === 'string' ? r.id : null;
      const emailRaw = Array.isArray(r.emails) && r.emails[0]?.email ? r.emails[0].email : null;
      const email = typeof emailRaw === 'string' && emailRaw.trim() ? emailRaw.trim().toLowerCase() : null;
      const phone = Array.isArray(r.phones) && r.phones[0]?.phone ? r.phones[0].phone : null;
      const name = r.display_name || 'Lead';
      const existing =
        (externalId ? db.select().from(leads).where(eq(leads.externalId, externalId)).get() : null) ??
        (email ? db.select().from(leads).where(eq(leads.email, email)).get() : null);
      if (existing) {
        db.update(leads)
          .set({
            externalId: externalId ?? existing.externalId,
            name,
            phone,
            email: email ?? existing.email,
            timezone: r.timezone || null,
            source: r.source || 'close',
          })
          .where(eq(leads.id, existing.id!))
          .run();
      } else {
        db.insert(leads).values({ externalId, name, email, phone, timezone: r.timezone || null, source: 'close' }).run();
      }
      imported++;
    }
    next = data?.has_more && data?.next ? `${BASE}${data.next}` : null;
    if (!data?.has_more && data?._has_more) next = null;
  }

  return NextResponse.json({ ok: true, imported });
}
